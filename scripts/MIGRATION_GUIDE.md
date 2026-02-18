# Access Database Migration Guide

This guide explains how to migrate student data from the Microsoft Access database (`.mdb` file) to School Hub's PostgreSQL database.

## Overview

The migration script reads student records from the Access database and creates:
- **Students** - User accounts with student role
- **Parents** - User accounts with parent role (linked to their children)
- **Classes** - Grade level classes (e.g., Grade 1, Grade 2)
- **Enrollments** - Student enrollments in their respective classes

## Prerequisites

### 1. Install Microsoft Access Driver

The migration requires the Microsoft Access Database Engine driver.

**Option A: Download Microsoft Access Database Engine**
- Download from Microsoft: https://www.microsoft.com/en-us/download/details.aspx?id=54920
- Choose the version matching your Python (32-bit or 64-bit)

**Option B: Install Office with Access**
- Microsoft Office Professional includes the required drivers

### 2. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 3. Start PostgreSQL Database

Ensure your PostgreSQL database is running (via Docker or local installation):

```bash
# Using Docker Compose (from project root)
docker-compose up -d postgres

# Or check if running
docker-compose ps
```

### 4. Run Database Migrations

Make sure the Prisma schema is applied to the database:

```bash
cd server
npm run prisma:migrate
npm run prisma:generate
```

## Migration Steps

### Step 1: Verify MDB File Location

Ensure the `.mdb` file is in the project root directory:
```
minivirson/
├── الابتدائية 2026 2025.mdb   <-- The Access database
├── scripts/
│   ├── migrate_access_to_postgres.py
│   └── requirements.txt
└── ...
```

### Step 2: Configure Environment

The script reads `DATABASE_URL` from the `.env` file in the project root. Make sure it's set correctly:

```env
DATABASE_URL="postgresql://sms_user:sms_password_2026@127.0.0.1:5433/school_messaging?schema=public"
```

### Step 3: Run the Migration

```bash
cd scripts
python migrate_access_to_postgres.py
```

### Step 4: Verify the Migration

After migration, you can verify the data using Prisma Studio:

```bash
cd server
npm run prisma:studio
```

Then check:
- **users** table - Should have students and parents
- **user_roles** table - Role assignments
- **parent_students** table - Parent-child relationships
- **classes** table - Created classes
- **class_enrollments** table - Student enrollments

## Data Mapping

### Access Table: `Données élèves` → School Hub Entities

| Access Field | School Hub Entity | Notes |
|--------------|------------------|-------|
| `الإسم` (First Name) | `users.first_name` | Student's first name |
| `اللقب` (Last Name) | `users.last_name` | Student's last name |
| `تاريخ الولادة` (Birth Date) | Not stored | Could be added to user profile |
| `مكان الولادة` (Birth Place) | Not stored | Could be added to user profile |
| `الجنس` (Gender) | Not stored | Could be added as metadata |
| `القسم` (Grade/Class) | `classes` + `class_enrollments` | Mapped to Grade 1-6 |
| `الولي` (Parent) | `users` (parent) | Parsed as father/mother |
| `الهاتف` (Phone) | `users.phone` | Parent's phone number |
| `العنوان` (Address) | Not stored | Could be added to user profile |
| `مهنة الولي` (Parent Job) | Not stored | Could be added as metadata |

### Grade Mapping

| Arabic | English | Code |
|--------|---------|------|
| سنة أولى | Grade 1 | G1 |
| سنة ثانية | Grade 2 | G2 |
| سنة ثالثة | Grade 3 | G3 |
| سنة رابعة | Grade 4 | G4 |
| سنة خامسة | Grade 5 | G5 |
| سنة سادسة | Grade 6 | G6 |

## Generated User Accounts

### Email Format
- **Students**: `{firstname}.{lastname}.student{index}@imported.school.tn`
- **Parents**: `{firstname}.{lastname}.parent{index}@imported.school.tn`

Example:
- Student: `mohamed.azer.student1@imported.school.tn`
- Parent: `anis.zer.parent1@imported.school.tn`

### Default Password
All imported users get the default password: **`Password123!`**

**Important**: Users should reset their passwords after first login.

## Troubleshooting

### Error: "Microsoft Access Driver not found"

**Solution**: Install the Microsoft Access Database Engine (see Prerequisites)

### Error: "DATABASE_URL not found"

**Solution**: Ensure the `.env` file exists in the project root with a valid `DATABASE_URL`

### Error: "relation 'users' does not exist"

**Solution**: Run Prisma migrations first:
```bash
cd server
npm run prisma:migrate
```

### Duplicate Phone Numbers

The script uses phone numbers to identify unique parents. If multiple students share the same parent phone, they will be linked to the same parent account.

### Encoding Issues

If you see garbled text for Arabic names, ensure:
1. Your terminal supports UTF-8
2. Python is running in UTF-8 mode (use `python -X utf8`)

## Customization

### Change Default Password

Edit the migration script:
```python
DEFAULT_PASSWORD = "YourNewPassword123!"
```

### Add More Fields

To map additional Access fields to School Hub:

1. Find the field in the `student` dictionary (line ~200)
2. Add it to the INSERT statement
3. Update the database schema if needed

Example - adding birth date:
```python
# In the INSERT statement, add:
birth_date if isinstance(birth_date, datetime) else None,
```

### Skip Certain Records

Add a filter condition:
```python
# Skip students without a name
if not first_name or not last_name:
    continue
```

## Rollback

To remove all imported data:

```sql
-- Run in PostgreSQL
DELETE FROM parent_students WHERE parent_id IN (
    SELECT id FROM users WHERE email LIKE '%@imported.school.tn'
);
DELETE FROM class_enrollments WHERE student_id IN (
    SELECT id FROM users WHERE email LIKE '%@imported.school.tn'
);
DELETE FROM user_roles WHERE user_id IN (
    SELECT id FROM users WHERE email LIKE '%@imported.school.tn'
);
DELETE FROM users WHERE email LIKE '%@imported.school.tn';
DELETE FROM classes WHERE term = '2025-2026';
```

## Post-Migration Tasks

After migration, consider:

1. **Set up teachers** - Manually assign teachers to classes
2. **Create admin accounts** - If not already done
3. **Configure messaging channels** - Set up classroom channels
4. **Notify parents** - Send login credentials via email/SMS
5. **Update passwords** - Require password reset on first login

## Support

For issues with the migration:
1. Check the error messages in the script output
2. Verify database connections
3. Check the logs in `stats['errors']`
4. Ensure all prerequisites are installed
