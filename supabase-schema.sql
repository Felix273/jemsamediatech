create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create or replace function public.set_site_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
before insert or update on public.site_content
for each row execute function public.set_site_content_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Public can read published site content" on public.site_content;
create policy "Public can read published site content"
on public.site_content for select
using (true);

drop policy if exists "Authenticated admins can manage site content" on public.site_content;
create policy "Authenticated admins can manage site content"
on public.site_content for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into public.site_content (id, content) values
('site_settings','{"email":"info@jemsamediatech.africa","phone":"+254 740 953 042","whatsapp":"https://wa.me/254740953042","location":"Nairobi, Kenya","footerBrandLine":"Pan-African marketing, media and technology built for ambitious brands.","footerTagline":"Growth, made visible."}'::jsonb),
('homepage','{"heroKicker":"Pan-African · Marketing · Media · Technology","heroTitle":"Growth,\nmade visible.","heroBody":"We unite strategy, creativity, media and technology to turn brand attention into measurable business growth across Africa.","introLabel":"Who we are","introTitle":"One group.\nEvery point of influence.","introLead":"Jemsa Media Group brings together specialist teams in digital marketing, branding and out-of-home advertising to build connected brand experiences.","companiesLabel":"Our companies","companiesTitle":"Three specialist engines. One growth partner.","workLabel":"Selected work","workTitle":"Ideas that moved into the world.","industriesLabel":"Industries we serve","industriesTitle":"Built to move at the speed of every sector.","partnersLabel":"Brands we have worked with","ctaTitle":"Ready to make your brand impossible to ignore?","ctaBody":"Tell us what growth looks like for you."}'::jsonb),
('about','{"heroLabel":"About Jemsa","heroTitle":"Built for the brands shaping Africa.","heroLead":"We combine specialist expertise with one connected view of growth—turning strategy into work people see, feel and act on.","storyLabel":"Our story","storyTitle":"Visibility is only valuable when it moves business.","storyLead":"Jemsa Media Group is a Pan-African integrated marketing, media and technology powerhouse bringing together specialised subsidiaries to deliver end-to-end brand growth solutions.","storyBody":"We help ambitious brands transform attention into measurable growth through strategic branding, digital marketing, content production, outdoor advertising and experiential campaigns.","storyImage":"assets/building_tower.webp","storyImageAlt":"Jemsa Media Group office building in Nairobi"}'::jsonb),
('subsidiaries','{"heroLabel":"Our companies","heroTitle":"Specialist by design. Connected by ambition.","heroLead":"Three focused companies working together to create end-to-end brand growth."}'::jsonb),
('work','{"heroLabel":"Our work","heroTitle":"Ideas built to be seen—and remembered.","heroLead":"Digital stories, brand experiences and outdoor campaigns shaped around a clear commercial goal."}'::jsonb),
('contact','{"heroLabel":"Contact","heroTitle":"Let’s make something move.","heroLead":"Tell us where your brand needs to go next. We’ll bring the right combination of strategy, creativity, media and production."}'::jsonb),
('campaigns','[{"id":"nescafe","title":"Write Your Amazing Stories","client":"Nescafé","category":"Digital","image":"assets/digital_1.webp","alt":"Nescafé Write Your Amazing Stories campaign","featured":true,"wide":true},{"id":"sprite","title":"Wallai, Inaslaaap!","client":"Sprite","category":"Digital","image":"assets/digital_2.webp","alt":"Sprite Lemon-Lime Soda campaign","featured":true},{"id":"multicurrency","title":"Kenya''s first multicurrency card","client":"Financial services","category":"OOH","image":"assets/ooh_1.webp","alt":"Multicurrency card digital billboard campaign","featured":true},{"id":"megaplay","title":"Bold Billboards. Big Buzz.","client":"Megaplay Arcade","category":"OOH","image":"assets/digital_3.webp","alt":"Megaplay Arcade billboard campaign","featured":true,"wide":true},{"id":"babyshower","title":"Baby Shower Activation","client":"Confidential Client","category":"Experiential","image":"assets/digital_4.webp","alt":"Baby shower experiential activation"},{"id":"smirnoff","title":"Smirnoff Ice in the city","client":"Smirnoff Ice","category":"OOH","image":"assets/ooh_2.webp","alt":"Smirnoff Ice large-format outdoor advertising"},{"id":"bankingapp","title":"Designed For You","client":"Financial services","category":"OOH","image":"assets/ooh_3.webp","alt":"Designed For You banking app campaign"},{"id":"vizz","title":"Feel The Vizz","client":"Character campaign","category":"OOH","image":"assets/ooh_4.webp","alt":"Feel The Vizz character billboard campaign"}]'::jsonb),
('partners','[]'::jsonb),
('industries','[]'::jsonb)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('site-media','site-media',true)
on conflict (id) do nothing;

drop policy if exists "Public can read site media" on storage.objects;
create policy "Public can read site media"
on storage.objects for select
using (bucket_id = 'site-media');

drop policy if exists "Authenticated admins can upload site media" on storage.objects;
create policy "Authenticated admins can upload site media"
on storage.objects for insert
with check (bucket_id = 'site-media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can update site media" on storage.objects;
create policy "Authenticated admins can update site media"
on storage.objects for update
using (bucket_id = 'site-media' and auth.role() = 'authenticated')
with check (bucket_id = 'site-media' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can delete site media" on storage.objects;
create policy "Authenticated admins can delete site media"
on storage.objects for delete
using (bucket_id = 'site-media' and auth.role() = 'authenticated');
