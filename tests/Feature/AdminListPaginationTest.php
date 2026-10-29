<?php

use App\Models\ContactMessage;
use App\Models\ContentPage;
use App\Models\GeneratedReport;
use App\Models\JobTaxonomy;
use App\Models\PlatformSetting;
use App\Models\Role;
use App\Models\TrainingCourse;
use App\Models\TrainingRegistration;
use App\Models\User;
use App\Notifications\PortalNotification;
use App\Support\ListPageSize;
use App\Support\TrainingMedia;
use Illuminate\Support\Facades\Storage;

test('admin lists use the default page size constant', function () {
    expect(ListPageSize::DEFAULT)->toBe(30);
});

test('admin management paginates admins', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    User::factory()->admin()->count(30)->create();

    $this->actingAs($superAdmin)
        ->get(route('admin.admins.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('admins.data', ListPageSize::DEFAULT)
            ->where('admins.total', 31)
            ->where('admins.last_page', 2));

    $this->actingAs($superAdmin)
        ->get(route('admin.admins.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('admins.data', 1)
            ->where('admins.current_page', 2));
});

test('contact messages paginate while unread stays a separate count', function () {
    $admin = User::factory()->admin()->create();
    ContactMessage::factory()->count(31)->create();

    $this->actingAs($admin)
        ->get(route('admin.contact-messages.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('messages.data', ListPageSize::DEFAULT)
            ->where('messages.total', 31)
            ->where('unread', 31));

    $this->actingAs($admin)
        ->get(route('admin.contact-messages.index', ['page' => 2, 'tab' => 'unread']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('messages.data', 1)
            ->where('unread', 31));
});

test('content management paginates pages and keeps the body for editing', function () {
    $admin = User::factory()->admin()->create();
    ContentPage::factory()->count(31)->create(['body' => 'Editable body']);

    $this->actingAs($admin)
        ->get(route('admin.content.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('pages.data', ListPageSize::DEFAULT)
            ->where('pages.total', 31)
            ->where('pages.data.0.body', 'Editable body'));
});

test('job taxonomies paginate and keep the type filter in links', function () {
    $admin = User::factory()->admin()->create();
    JobTaxonomy::factory()->count(31)->create(['type' => 'duty_station']);

    $this->actingAs($admin)
        ->get(route('admin.job-filters.index', ['type' => 'duty_station']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('items.data', ListPageSize::DEFAULT)
            ->where('items.total', 31)
            ->where('filters.type', 'duty_station')
            ->where('items.next_page_url', fn ($url) => str_contains((string) $url, 'type=duty_station')));
});

test('training courses paginate', function () {
    $admin = User::factory()->admin()->create();
    TrainingCourse::factory()->count(31)->create();

    $this->actingAs($admin)
        ->get(route('admin.training.courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('courses.data', ListPageSize::DEFAULT)
            ->where('courses.total', 31));
});

test('training registrations paginate while export still includes every row', function () {
    $admin = User::factory()->admin()->create();
    $course = TrainingCourse::factory()->create(['seats' => 100]);
    TrainingRegistration::factory()->count(31)->create(['training_course_id' => $course->id]);

    $this->actingAs($admin)
        ->get(route('admin.training.registrations.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('registrations.data', ListPageSize::DEFAULT)
            ->where('registrations.total', 31));

    $export = $this->actingAs($admin)
        ->get(route('admin.training.registrations.export'));

    $export->assertOk();
    expect(substr_count(trim($export->streamedContent()), "\n"))->toBe(31);
});

test('generated reports paginate', function () {
    $admin = User::factory()->admin()->create();
    GeneratedReport::factory()->count(31)->create(['generated_by' => $admin->id]);

    $this->actingAs($admin)
        ->get(route('admin.reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('reports.data', ListPageSize::DEFAULT)
            ->where('reports.total', 31));
});

test('admin notifications paginate and apply the unread tab before paginating', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 31) as $number) {
        $admin->notify(new PortalNotification("Notice {$number}", 'Body', 'System'));
    }

    $admin->notifications()->limit(5)->get()->each->markAsRead();

    $this->actingAs($admin)
        ->get(route('admin.notifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notifications.data', ListPageSize::DEFAULT)
            ->where('notifications.total', 31));

    $this->actingAs($admin)
        ->get(route('admin.notifications.index', ['tab' => 'unread']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('notifications.data', 26)
            ->where('notifications.total', 26)
            ->where('unread', 26)
            ->where('tab', 'unread'));
});

test('role permissions paginate roles and limit matrix columns to the current page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 31) as $number) {
        Role::query()->create([
            'name' => "custom-role-{$number}",
            'guard_name' => 'web',
            'label' => "Custom role {$number}",
            'is_system' => false,
            'is_locked' => false,
        ]);
    }

    $this->actingAs($admin)
        ->get(route('admin.roles-permissions.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('roles.data', ListPageSize::DEFAULT)
            ->where('roles.last_page', 2)
            ->has('permissionMatrix.0.roles', ListPageSize::DEFAULT)
            ->where('permissionMatrix.0.roles', fn ($roles) => count($roles) === ListPageSize::DEFAULT));
});

test('training media paginates documents with their own page name', function () {
    Storage::fake('public');

    $documents = collect(range(1, 31))->map(function (int $number): array {
        $path = "training/documents/doc-{$number}.pdf";
        Storage::disk('public')->put($path, 'pdf');

        return [
            'id' => "doc-{$number}",
            'name' => "Document {$number}",
            'file_name' => "doc-{$number}.pdf",
            'path' => $path,
            'mime' => 'application/pdf',
            'size' => 3,
        ];
    })->all();

    PlatformSetting::query()->updateOrCreate(
        ['key' => TrainingMedia::SETTING_KEY],
        ['value' => ['videos' => [], 'documents' => $documents]],
    );

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.training.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', ListPageSize::DEFAULT)
            ->where('documents.total', 31)
            ->where('videos.total', 0));

    $this->actingAs($admin)
        ->get(route('admin.training.index', ['documents_page' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('documents.data', 1)
            ->where('documents.current_page', 2)
            ->where('documents.data.0.name', 'Document 31'));
});
