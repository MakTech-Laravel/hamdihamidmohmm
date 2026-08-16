<?php

$resources = dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources';

test('the theme uses the updated Figma color tokens', function () use ($resources) {
    $css = file_get_contents($resources.DIRECTORY_SEPARATOR.'css'.DIRECTORY_SEPARATOR.'app.css');

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
    $css = file_get_contents($resources.DIRECTORY_SEPARATOR.'css'.DIRECTORY_SEPARATOR.'app.css');

    expect($css)->not->toBeFalse()
        ->toContain('button:not(:disabled)')
        ->toContain('cursor: pointer');
});

test('the public header uses Figma primary and background colors', function () use ($resources) {
    $header = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'header.tsx');

    expect($header)->not->toBeFalse()
        ->toContain('bg-[#0057c8]')
        ->toContain('text-[#d1f6ff]')
        ->toContain('text-[#1c398e]')
        ->toContain('bg-[#1e3a8a]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the public home hero uses Figma accent and floating stat colors', function () use ($resources) {
    $home = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'home.tsx');

    expect($home)->not->toBeFalse()
        ->toContain('text-[#e57124]')
        ->toContain('lg:text-[64px]')
        ->toContain('lg:leading-[76px]')
        ->toContain('h-[60px]')
        ->toContain('text-[#1e3a8a]')
        ->toContain('text-[#f97316]')
        ->not->toContain('text-[#c2410c]');
});

test('the public footer uses Figma LinkedIn social icons', function () use ($resources) {
    $footer = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'footer.tsx');

    expect($footer)->not->toBeFalse()
        ->toContain("src: '/images/home/linkedin.svg'")
        ->toContain("src: '/images/home/x.svg'")
        ->toContain("src: '/images/home/facebook.svg'")
        ->not->toContain('instagram.svg');
});

test('the public pricing page includes the Figma three-package layout', function () use ($resources) {
    $pricing = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR.'pricing-package-cards.tsx');

    expect($pricing)->not->toBeFalse()
        ->toContain('lg:grid-cols-3')
        ->toContain('packages.map')
        ->toContain('is_featured')
        ->toContain('bg-[#0057c8]')
        ->not->toContain('bg-[#3977a6] p-7');
});

test('the employer dashboard uses the Figma dashboard frame tokens', function () use ($resources) {
    $dashboard = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerDashboard.tsx');
    $header = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'employer'.DIRECTORY_SEPARATOR.'header.tsx');
    $sidebar = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'employer'.DIRECTORY_SEPARATOR.'sidebar.tsx');
    $layout = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'employer-layout.tsx');

    expect($dashboard)->not->toBeFalse()
        ->toContain('Welcome back')
        ->toContain('+ Post a New Job')
        ->toContain('Quick Actions')
        ->toContain('Verified')
        ->toContain('text-[#e57124]')
        ->toContain('bg-[#fff7ed]')
        ->toContain('Upgrade Plan')
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
    $profile = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerCompanyProfile.tsx');

    expect($profile)->not->toBeFalse()
        ->toContain('Profile Completion')
        ->toContain('Incomplete sections:')
        ->toContain('Verification Status')
        ->toContain('/images/employer/verified-shield.svg')
        ->toContain('size-24')
        ->toContain('stroke="#E57124"')
        ->not->toContain('lg:grid-cols-2')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer packages cards pin select plan buttons to the same baseline', function () use ($resources) {
    $packages = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerPackages.tsx');

    expect($packages)->not->toBeFalse()
        ->toContain('flex h-full flex-col')
        ->toContain('mt-auto pt-6')
        ->toContain('Select Plan');
});

test('the employer notifications page uses the Figma card layout', function () use ($resources) {
    $notifications = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerNotifications.tsx');

    expect($notifications)->not->toBeFalse()
        ->toContain('Stay updated with applications, jobs, and account')
        ->toContain('Mark All as Read')
        ->toContain('unread')
        ->toContain('Mark as Read')
        ->toContain('Delete')
        ->toContain('bg-[#fff7ed]')
        ->toContain('text-[#e57124]')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer settings page uses the Figma account layout', function () use ($resources) {
    $settings = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerSettings.tsx');

    expect($settings)->not->toBeFalse()
        ->toContain('Manage your account preferences and configurations')
        ->toContain('Phone Number')
        ->toContain('Save Changes')
        ->toContain('Danger Zone')
        ->toContain('bg-[#0057c8]/10')
        ->toContain('New Applications')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer applications page uses the Figma table layout', function () use ($resources) {
    $applications = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerApplications.tsx');

    expect($applications)->not->toBeFalse()
        ->toContain('Manage candidates across all stages')
        ->toContain('Interviews Scheduled')
        ->toContain('Search candidates...')
        ->toContain('Job Applied')
        ->toContain('Experience')
        ->toContain('View')
        ->toContain('Move')
        ->toContain('Reject')
        ->toContain('text-[#0057c8]')
        ->toContain('/images/jobs/search.svg')
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the employer my jobs page uses the Figma table layout', function () use ($resources) {
    $jobs = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'User'.DIRECTORY_SEPARATOR.'EmployerJobs.tsx');

    expect($jobs)->not->toBeFalse()
        ->toContain('+ Post New Job')
        ->toContain('Location / Type')
        ->toContain('View Applicants')
        ->toContain('/images/jobs/search.svg')
        ->toContain('bg-[#e57124]')
        ->toContain("id: 'closed'")
        ->not->toContain('#323981')
        ->not->toContain('#ffebf5');
});

test('the admin job management page uses the Figma list layout', function () use ($resources) {
    $jobs = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'pages'.DIRECTORY_SEPARATOR.'backend'.DIRECTORY_SEPARATOR.'Admin'.DIRECTORY_SEPARATOR.'JobManagement.tsx');
    $drawer = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'components'.DIRECTORY_SEPARATOR.'admin-portal'.DIRECTORY_SEPARATOR.'candidate-preview-drawer.tsx');

    expect($jobs)->not->toBeFalse()
        ->toContain('Job Management')
        ->toContain('Search by title, employer')
        ->toContain('JOB-')
        ->toContain('Created')
        ->toContain('Active Jobs')
        ->toContain('Pending Jobs')
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
        ->toContain('Download Resume')
        ->toContain('Status Timeline')
        ->toContain('bg-[#d1f6ff]')
        ->toContain('bg-[#fdf4ff]')
        ->toContain('w-[400px]');
});

test('the admin sidebar uses the Figma white surface and primary blue', function () use ($resources) {
    $sidebar = file_get_contents($resources.DIRECTORY_SEPARATOR.'js'.DIRECTORY_SEPARATOR.'layouts'.DIRECTORY_SEPARATOR.'partials'.DIRECTORY_SEPARATOR.'admin-portal'.DIRECTORY_SEPARATOR.'sidebar.tsx');

    expect($sidebar)->not->toBeFalse()
        ->toContain('bg-white')
        ->toContain('text-[#0057c8]')
        ->toContain('text-[#3977a6]')
        ->not->toContain('#ffebf5')
        ->not->toContain('#323981');
});
