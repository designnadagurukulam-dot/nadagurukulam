

# Update Dashboard Greeting to "Sai Ram {Role} {Name}"

## Change
Replace the time-based greeting ("Good Morning/Afternoon/Evening, {name}") with a fixed format: **"Sai Ram"** on the first line, then **"{Role} {Name}"** on the second line.

Examples:
- Student named Vikas → **Sai Ram** / **Student Vikas**
- Tutor named Vikky → **Sai Ram** / **Tutor Vikky**
- Admin named Srini → **Sai Ram** / **Admin Srini**

## File Modified
`src/components/DashboardLayout.tsx`

## What Changes
1. Remove the `getGreeting()` function entirely
2. Import `role` from `useAuth()` (already available)
3. Map role to display label: `student` → "Student", `instructor` → "Tutor", `super_admin`/`admin` → "Admin"
4. Replace the greeting section:
   - Line 1: `"Sai Ram"` (small warm-grey text)
   - Line 2: `"{Role} {Name}"` (serif heading in brand-primary)

