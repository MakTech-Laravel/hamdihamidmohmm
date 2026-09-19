<?php

$resources = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'resources';

test('the theme uses the updated Figma color tokens', function () use ($resources) {
    $css = file_get_contents($resources . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'app.css');

    expect($css)->not->toBeFalse()
        ->toContain('--primary: #0057c8')
        ->toContain('--secondary: #3977a6')
        ->toContain('--accent: #e57124')
        ->toContain('--cream: #d1f6ff')
        ->toContain('--foreground: #050315')
        ->toContain('--sidebar: #ffffff')
        ->not->toContain('--primary: #0f182e')
        ->not->toContain('--accent: #FAF5FF');
});

test('buttons use a pointer cursor on hover', function () use ($resources) {
    $css = file_get_contents($resources . DIRECTORY_SEPARATOR . 'css' . DIRECTORY_SEPARATOR . 'app.css');

    expect($css)->not->toBeFalse()
        ->toContain('button:not(:disabled)')
        ->toContain('cursor: pointer');
});

test('the public header uses Figma primary and background colors', function () use ($resources) {
    $header = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'header.tsx');

    expect($header)->not->toBeFalse()
        ->toContain('bg-[#0057c8]')
        ->toContain('text-[#d1f6ff]')
        ->toContain('text-[#1c398e]')
        ->toContain('bg-[#1e3a8a]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the public home hero uses Figma accent and floating stat colors', function () use ($resources) {
    $home = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'home.tsx');

    expect($home)->not->toBeFalse()
        ->toContain('text-[#e57124]')
        ->toContain('lg:text-[64px]')
        ->toContain('lg:leading-[76px]')
        ->toContain('h-[60px]')
        ->toContain('text-[#1e3a8a]')
        ->toContain('text-[#f97316]')
        ->toContain('recommendedJobs')
        ->toContain('Recommended Jobs')
        ->toContain('JobSearchForm')
        ->not->toContain('Featured Jobs')
        ->not->toContain('featuredJobs')
        ->not->toContain('text-[#c2410c]');
});

test('the public footer uses Figma LinkedIn social icons', function () use ($resources) {
    $footer = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'footer.tsx');

    expect($footer)->not->toBeFalse()
        ->toContain("src: '/images/home/linkedin.svg'")
        ->toContain("src: '/images/home/x.svg'")
        ->toContain("src: '/images/home/facebook.svg'")
        ->not->toContain('instagram.svg');
});

test('the public pricing page includes the Figma three-package layout', function () use ($resources) {
    $pricing = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'pricing-package-cards.tsx');

    expect($pricing)->not->toBeFalse()
        ->toContain('lg:grid-cols-3')
        ->toContain('packages.map')
        ->toContain('is_featured')
        ->toContain('bg-[#0057c8]')
        ->not->toContain('bg-[#3977a6] p-7');
});

test('the employer dashboard uses the Figma dashboard frame tokens', function () use ($resources) {
    $dashboard = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerDashboard.tsx');
    $header = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'employer' . DIRECTORY_SEPARATOR . 'header.tsx');
    $sidebar = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'employer' . DIRECTORY_SEPARATOR . 'sidebar.tsx');
    $layout = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'employer-layout.tsx');

    expect($dashboard)->not->toBeFalse()
        ->toContain("t('employer.dashboard.welcome'")
        ->toContain("t('employer.jobs.create')")
        ->toContain("t('employer.dashboard.quick_actions')")
        ->toContain("t('common.verified')")
        ->toContain('text-[#e57124]')
        ->toContain('bg-[#fff7ed]')
        ->toContain("t('employer.dashboard.upgrade_plan')")
        ->toContain('from-[#e57124] to-[#f59e0b]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');

    expect($layout)->not->toBeFalse()
        ->toContain('bg-[#f8faff]');

    expect($header)->not->toBeFalse()
        ->toContain('/images/employer/external-link.svg')
        ->toContain('/images/employer/bell.svg')
        ->toContain('bg-[#d1f6ff]')
        ->not->toContain('#ffebf5');

    expect($sidebar)->not->toBeFalse()
        ->toContain('/images/employer/logout.svg')
        ->toContain('h-[51px] w-[76px]')
        ->toContain('bg-[#d1f6ff]')
        ->toContain('text-[#0057c8]');
});

test('the employer company profile uses the Figma completion and verification cards', function () use ($resources) {
    $profile = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerCompanyProfile.tsx');

    expect($profile)->not->toBeFalse()
        ->toContain("t('employer.profile.completion')")
        ->toContain("t('employer.profile.incomplete')")
        ->toContain("t('employer.profile.verification_status')")
        ->toContain('/images/employer/verified-shield.svg')
        ->toContain('size-24')
        ->toContain('stroke="#E57124"')
        ->not->toContain('lg:grid-cols-2')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer packages cards pin select plan buttons to the same baseline', function () use ($resources) {
    $packages = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerPackages.tsx');

    expect($packages)->not->toBeFalse()
        ->toContain('flex h-full flex-col')
        ->toContain('mt-auto pt-6')
        ->toContain("t('employer.packages.btn.select')")
        ->toContain("t('employer.packages.btn.upgrade')")
        ->toContain("t('employer.packages.btn.downgrade')")
        ->toContain("t('employer.packages.btn.current')");
});

test('the employer notifications page uses the Figma card layout', function () use ($resources) {
    $notifications = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerNotifications.tsx');

    expect($notifications)->not->toBeFalse()
        ->toContain("t('employer.notifications.subtitle')")
        ->toContain("t('employer.notifications.mark_all')")
        ->toContain('unread')
        ->toContain("t('common.mark_as_read')")
        ->toContain("t('common.delete')")
        ->toContain('bg-[#fff7ed]')
        ->toContain('text-[#e57124]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer settings page uses the Figma account layout', function () use ($resources) {
    $settings = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerSettings.tsx');

    expect($settings)->not->toBeFalse()
        ->toContain("t('employer.settings.subtitle')")
        ->toContain("t('employer.settings.phone')")
        ->toContain("t('common.save_changes')")
        ->toContain("t('employer.settings.danger_title')")
        ->toContain('bg-[#0057c8]/10')
        ->toContain("t('employer.settings.notif.new_applications')")
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer applications page uses the Figma table layout', function () use ($resources) {
    $applications = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerApplications.tsx');
    $drawer = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'employer' . DIRECTORY_SEPARATOR . 'application-preview-drawer.tsx');

    expect($applications)->not->toBeFalse()
        ->toContain("t('employer.applications.subtitle')")
        ->toContain("t('employer.applications.stat.interviews')")
        ->toContain("'employer.applications.search'")
        ->toContain("t('employer.applications.col.job')")
        ->toContain("'employer.applications.col.experience'")
        ->toContain("t('common.view')")
        ->toContain("'employer.applications.move'")
        ->toContain("t('common.reject')")
        ->toContain('ApplicationPreviewDrawer')
        ->toContain('text-[#0057c8]')
        ->toContain('/images/jobs/search.svg')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');

    expect($drawer)->not->toBeFalse()
        ->toContain("t('employer.drawer.download_resume')")
        ->toContain("t('employer.drawer.status_timeline')")
        ->toContain("t('employer.drawer.change_status')")
        ->toContain("t('employer.drawer.schedule_interview')")
        ->toContain("t('employer.drawer.send_message')")
        ->toContain("t('employer.drawer.professional')")
        ->toContain("t('employer.drawer.education')")
        ->toContain("t('employer.drawer.cover_letter')")
        ->toContain('bg-[#d1f6ff]')
        ->toContain('bg-[#0057c8]')
        ->toContain('w-[400px]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer my jobs page uses the Figma table layout', function () use ($resources) {
    $jobs = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'EmployerJobs.tsx');

    expect($jobs)->not->toBeFalse()
        ->toContain("t('employer.jobs.post_new')")
        ->toContain("t('employer.jobs.col.location_type')")
        ->toContain("'employer.jobs.view_applicants'")
        ->toContain("t('common.view')")
        ->toContain('size-16')
        ->toContain('/images/jobs/search.svg')
        ->toContain('bg-[#e57124]')
        ->toContain("id: 'closed'")
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the admin job management page uses the Figma list layout', function () use ($resources) {
    $jobs = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'Admin' . DIRECTORY_SEPARATOR . 'JobManagement.tsx');
    $drawer = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'admin-portal' . DIRECTORY_SEPARATOR . 'candidate-preview-drawer.tsx');

    expect($jobs)->not->toBeFalse()
        ->toContain("t('admin.jobs.title')")
        ->toContain("t('admin.jobs.search_placeholder')")
        ->toContain('JOB-')
        ->toContain("t('common.created')")
        ->toContain("t('admin.jobs.stats.active')")
        ->toContain("t('admin.jobs.stats.pending')")
        ->toContain('text-[#e57124]')
        ->toContain('text-[#f59e0b]')
        ->toContain('bg-[#dbeafe]')
        ->toContain('text-[#1e40af]')
        ->not->toContain('Featured Jobs')
        ->not->toContain('Edit job')
        ->not->toContain('Pencil')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');

    expect($drawer)->not->toBeFalse()
        ->toContain("t('admin.candidate.download_resume')")
        ->toContain("t('admin.candidate.status_timeline')")
        ->toContain("t('admin.candidate.professional')")
        ->toContain("t('admin.candidate.education')")
        ->toContain("t('admin.candidate.cover_letter')")
        ->toContain('bg-[#d1f6ff]')
        ->toContain('bg-[#fdf4ff]')
        ->toContain('w-[400px]');
});

test('the admin sidebar uses the Figma white surface and primary blue', function () use ($resources) {
    $sidebar = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'admin-portal' . DIRECTORY_SEPARATOR . 'sidebar.tsx');

    expect($sidebar)->not->toBeFalse()
        ->toContain('bg-white')
        ->toContain('text-[#0057c8]')
        ->toContain('text-[#3977a6]')
        ->not->toContain('#ffebf5')
        ->not->toContain('#323981');
});

test('the job seeker portal pages use the Figma phase one layouts', function () use ($resources) {
    $dashboard = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'JobSeekerDashboard.tsx');
    $applications = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'JobSeekerApplications.tsx');
    $profile = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'pages' . DIRECTORY_SEPARATOR . 'backend' . DIRECTORY_SEPARATOR . 'User' . DIRECTORY_SEPARATOR . 'JobSeekerProfile.tsx');
    $sidebar = file_get_contents($resources . DIRECTORY_SEPARATOR . 'js' . DIRECTORY_SEPARATOR . 'layouts' . DIRECTORY_SEPARATOR . 'partials' . DIRECTORY_SEPARATOR . 'job-seeker' . DIRECTORY_SEPARATOR . 'sidebar.tsx');

    expect($dashboard)->not->toBeFalse()
        ->toContain("t('job_seeker.dashboard.welcome'")
        ->toContain("t('job_seeker.dashboard.under_review')")
        ->toContain("t('job_seeker.dashboard.shortlisted')")
        ->toContain("t('job_seeker.profile.completion'")
        ->toContain("t('job_seeker.dashboard.quick_actions')")
        ->toContain("t('job_seeker.dashboard.notifications')")
        ->toContain('bg-[#e57124]')
        ->not->toContain('#323981');

    expect($applications)->not->toBeFalse()
        ->toContain("t('job_seeker.applications.subtitle')")
        ->toContain("t('job_seeker.applications.view_details')")
        ->toContain('ApplicationDetailDrawer')
        ->toContain('text-[#e57124]')
        ->not->toContain('#323981');

    expect($profile)->not->toBeFalse()
        ->toContain("t('job_seeker.profile.personal')")
        ->toContain("t('job_seeker.profile.professional')")
        ->toContain("t('job_seeker.profile.linkedin')")
        ->toContain("t('job_seeker.profile.expected_salary')")
        ->toContain("t('job_seeker.profile.available_for')")
        ->toContain("t('job_seeker.profile.save')")
        ->toContain("t('job_seeker.profile.school')")
        ->toContain("t('job_seeker.profile.field_of_study')")
        ->toContain("t('job_seeker.profile.add_education')")
        ->toContain("t('job_seeker.profile.add_experience')")
        ->toContain("t('job_seeker.profile.add_language')")
        ->toContain('NativeSelect')
        ->toContain("t('job_seeker.profile.resume')")
        ->toContain("t('job_seeker.profile.resume_upload_new')")
        ->toContain('border-[#e8d5e8]')
        ->toContain('h-[42px]')
        ->toContain('from-[#0057c8]')
        ->not->toContain('Education JSON')
        ->not->toContain('Experience JSON')
        ->not->toContain('Comma-separated skills')
        ->not->toContain('Comma-separated, e.g. Full Time, Remote')
        ->not->toContain('Upload a resume when you apply to jobs.')
        ->not->toContain('#323981');

    expect($sidebar)->not->toBeFalse()
        ->toContain("t('job_seeker.profile.fallback_name')")
        ->toContain("t('job_seeker.portal')");
});
