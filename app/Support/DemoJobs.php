<?php

namespace App\Support;

class DemoJobs
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        $defaults = [
            'company_website' => 'https://example.com',
            'deadline' => 'Aug 30, 2026',
            'vacancies' => 'Not Specified',
            'responsibilities' => [
                'Deliver high-quality work on time',
                'Collaborate with cross-functional teams',
                'Maintain clear documentation',
                'Contribute to continuous improvement',
            ],
            'requirements' => [
                'Relevant professional experience',
                'Strong communication skills',
                'Ability to work independently',
                'Attention to detail',
            ],
            'benefits' => [
                'Health Insurance',
                'Annual Bonus',
                'Remote Work Options',
                'Learning Budget',
            ],
        ];

        $jobs = [
            [
                'slug' => 'senior-frontend-developer',
                'initials' => 'TC',
                'title' => 'Senior Frontend Developer',
                'company' => 'TechCorp Solutions',
                'company_industry' => 'Technology',
                'company_about' => 'TechCorp Solutions is a leading technology company specializing in innovative software solutions for enterprises across the Middle East.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Riyadh, Saudi Arabia',
                'experience' => '3–5 Years',
                'salary' => 'SAR 15,000 – 20,000',
                'posted' => '2 days ago',
                'industry' => 'Software',
                'overview' => 'Join our dynamic team to build next-generation web applications that serve millions of users across the region.',
                'responsibilities' => [
                    'Build and maintain responsive web applications',
                    'Collaborate with design and backend teams',
                    'Write clean, testable, and maintainable code',
                    'Participate in code reviews and technical discussions',
                ],
                'requirements' => [
                    '3+ years experience with React',
                    'Strong TypeScript proficiency',
                    'Experience with REST APIs',
                    'Git version control',
                ],
                'similar' => [
                    [
                        'slug' => 'data-scientist',
                        'initials' => 'IA',
                        'title' => 'Data Scientist',
                        'company' => 'Insight Analytics',
                    ],
                ],
            ],
            [
                'slug' => 'marketing-manager',
                'initials' => 'BH',
                'title' => 'Marketing Manager',
                'company' => 'BrandHouse Agency',
                'company_industry' => 'Marketing',
                'company_about' => 'BrandHouse Agency helps growing brands craft memorable campaigns across digital and traditional channels.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Jeddah, Saudi Arabia',
                'experience' => '5–7 Years',
                'salary' => 'SAR 18,000 – 25,000',
                'posted' => '1 day ago',
                'deadline' => 'Sep 15, 2026',
                'vacancies' => '2',
                'industry' => 'Marketing',
                'overview' => 'Lead multi-channel marketing initiatives and grow brand awareness across the GCC market.',
            ],
            [
                'slug' => 'financial-analyst',
                'initials' => 'GF',
                'title' => 'Financial Analyst',
                'company' => 'Gulf Finance Group',
                'company_industry' => 'Finance',
                'company_about' => 'Gulf Finance Group provides investment and advisory services across the MENA region.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Dubai, UAE',
                'experience' => '2–4 Years',
                'salary' => 'AED 12,000 – 16,000',
                'posted' => '3 days ago',
                'industry' => 'Finance',
                'overview' => 'Analyze financial performance and support strategic decision-making for key accounts.',
            ],
            [
                'slug' => 'ux-ui-designer',
                'initials' => 'PC',
                'title' => 'UX/UI Designer',
                'company' => 'PixelCraft Studio',
                'company_industry' => 'Design',
                'company_about' => 'PixelCraft Studio designs product experiences for startups and established brands.',
                'type_key' => 'remote',
                'type' => 'Remote',
                'location' => 'Remote',
                'experience' => '2–3 Years',
                'salary' => 'SAR 10,000 – 14,000',
                'posted' => '4 days ago',
                'industry' => 'Design',
                'overview' => 'Design intuitive interfaces and improve product usability across web and mobile.',
            ],
            [
                'slug' => 'hr-business-partner',
                'initials' => 'NC',
                'title' => 'HR Business Partner',
                'company' => 'NovaCorp International',
                'company_industry' => 'Human Resources',
                'company_about' => 'NovaCorp International partners with organizations to build high-performing teams.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Riyadh, Saudi Arabia',
                'experience' => '4–6 Years',
                'salary' => 'SAR 16,000 – 22,000',
                'posted' => '5 days ago',
                'industry' => 'HR',
                'overview' => 'Partner with business leaders to shape talent strategy and employee experience.',
            ],
            [
                'slug' => 'sales-representative',
                'initials' => 'AR',
                'title' => 'Sales Representative',
                'company' => 'AlphaRetail Group',
                'company_industry' => 'Retail',
                'company_about' => 'AlphaRetail Group operates a growing network of retail brands across Saudi Arabia.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Dammam, Saudi Arabia',
                'experience' => '1–3 Years',
                'salary' => 'SAR 7,000 – 10,000 + Commission',
                'posted' => '1 week ago',
                'industry' => 'Sales',
                'overview' => 'Drive sales growth by building relationships with customers and closing opportunities.',
            ],
            [
                'slug' => 'backend-engineer',
                'initials' => 'QS',
                'title' => 'Backend Engineer',
                'company' => 'Qatar Soft Labs',
                'company_industry' => 'Technology',
                'company_about' => 'Qatar Soft Labs builds scalable backend platforms for modern digital products.',
                'type_key' => 'contract',
                'type' => 'Contract',
                'location' => 'Doha, Qatar',
                'experience' => '3–5 Years',
                'salary' => 'QAR 14,000 – 18,000',
                'posted' => '6 days ago',
                'industry' => 'Software',
                'overview' => 'Design and implement reliable APIs and services that power customer-facing products.',
            ],
            [
                'slug' => 'content-specialist',
                'initials' => 'SM',
                'title' => 'Content Specialist',
                'company' => 'Sahara Media',
                'company_industry' => 'Media',
                'company_about' => 'Sahara Media creates engaging content for brands across the region.',
                'type_key' => 'part_time',
                'type' => 'Part Time',
                'location' => 'Jeddah, Saudi Arabia',
                'experience' => '1–2 Years',
                'salary' => 'SAR 5,000 – 7,000',
                'posted' => '2 weeks ago',
                'industry' => 'Media',
                'overview' => 'Create compelling content that strengthens brand voice and audience engagement.',
            ],
            [
                'slug' => 'data-scientist',
                'initials' => 'IA',
                'title' => 'Data Scientist',
                'company' => 'Insight Analytics',
                'company_industry' => 'Technology',
                'company_about' => 'Insight Analytics turns complex data into actionable insights for enterprise clients.',
                'type_key' => 'full_time',
                'type' => 'Full Time',
                'location' => 'Riyadh, Saudi Arabia',
                'experience' => '3–5 Years',
                'salary' => 'SAR 16,000 – 22,000',
                'posted' => '3 days ago',
                'industry' => 'Software',
                'overview' => 'Build predictive models and analytics solutions that help clients make smarter decisions.',
                'responsibilities' => [
                    'Develop and deploy machine learning models',
                    'Partner with product and engineering teams',
                    'Present insights to technical and business audiences',
                    'Maintain data quality and documentation',
                ],
                'requirements' => [
                    '3+ years in data science roles',
                    'Strong Python and SQL skills',
                    'Experience with ML frameworks',
                    'Clear communication skills',
                ],
                'similar' => [
                    [
                        'slug' => 'senior-frontend-developer',
                        'initials' => 'TC',
                        'title' => 'Senior Frontend Developer',
                        'company' => 'TechCorp Solutions',
                    ],
                ],
            ],
        ];

        $indexed = [];

        foreach ($jobs as $job) {
            $slug = $job['slug'];
            $indexed[$slug] = array_merge($defaults, $job);

            if (! isset($indexed[$slug]['similar'])) {
                $indexed[$slug]['similar'] = [
                    [
                        'slug' => 'senior-frontend-developer',
                        'initials' => 'TC',
                        'title' => 'Senior Frontend Developer',
                        'company' => 'TechCorp Solutions',
                    ],
                ];
            }
        }

        return $indexed;
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $slug): ?array
    {
        return self::all()[$slug] ?? null;
    }
}
