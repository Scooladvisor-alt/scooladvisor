import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const domain = "https://scooladvisor.fr";
        
        // Static pages
        const staticPages = [
            { url: "/", priority: "1.0", changefreq: "daily" },
            { url: "/About", priority: "0.8", changefreq: "monthly" },
            { url: "/Contact", priority: "0.5", changefreq: "yearly" },
            { url: "/TermsOfService", priority: "0.3", changefreq: "yearly" },
            { url: "/PrivacyPolicy", priority: "0.3", changefreq: "yearly" }
        ];

        // Fetch dynamic content (Schools and Teachers)
        // Use service role to ensure we get all approved items without RLS issues if applicable
        // though listing public data should be fine with standard client usually, 
        // using service role ensures we get data even if there are strict RLS.
        // But better to use standard client to respect visibility rules if possible.
        // Since we want public sitemap, we should only list what a public user can see.
        // Assuming base44.entities returns public data by default for unauthenticated.
        // However, backend functions are "server-side", user auth depends on the request token.
        // If no token, we are guest.
        
        // Let's use asServiceRole to facilitate fetching ALL for the sitemap (crawler perspective)
        // Filtering for approved/published content is crucial.
        
        const schools = await base44.asServiceRole.entities.School.filter({ is_deleted: false }); // Assuming status approved check if needed
        const teachers = await base44.asServiceRole.entities.Teacher.filter({ is_deleted: false, status: "approved" });

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // Add static pages
        staticPages.forEach(page => {
            xml += `
    <url>
        <loc>${domain}${page.url}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
        });

        // Add Schools
        schools.forEach(school => {
            xml += `
    <url>
        <loc>${domain}/SchoolDetail?id=${school.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
        <lastmod>${new Date(school.updated_date || school.created_date).toISOString().split('T')[0]}</lastmod>
    </url>`;
        });

        // Add Teachers
        teachers.forEach(teacher => {
            xml += `
    <url>
        <loc>${domain}/TeacherDetail?id=${teacher.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <lastmod>${new Date(teacher.updated_date || teacher.created_date).toISOString().split('T')[0]}</lastmod>
    </url>`;
        });

        xml += `
</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                "Content-Type": "application/xml",
                "Cache-Control": "max-age=3600"
            }
        });

    } catch (error) {
        console.error("Sitemap generation error:", error);
        return new Response(`Error generating sitemap: ${error.message}`, { status: 500 });
    }
});