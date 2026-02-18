#!/usr/bin/env python3
"""
Migration script: Microsoft Access (MDB) to PostgreSQL
Converts Tunisian primary school student data to School Hub format

Prerequisites:
    pip install pyodbc psycopg2-binary python-dotenv

Usage:
    python migrate_access_to_postgres.py
"""

import os
import sys
import re
import glob
import uuid
import hashlib
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any

# Configuration
MDB_FILE_PATTERN = "*.mdb"
DEFAULT_PASSWORD = "Password123!"  # Default password for imported users
SCHOOL_YEAR = "2025-2026"

# Grade mapping from Arabic to English
GRADE_MAPPING = {
    "سنة أولى": ("Grade 1", "G1"),
    "سنة ثانية": ("Grade 2", "G2"),
    "سنة ثالثة": ("Grade 3", "G3"),
    "سنة رابعة": ("Grade 4", "G4"),
    "سنة خامسة": ("Grade 5", "G5"),
    "سنة سادسة": ("Grade 6", "G6"),
}

# Gender mapping
GENDER_MAPPING = {
    "ذكر": "male",
    "أنثى": "female",
}


def get_mdb_file() -> Optional[str]:
    """Find the MDB file in the project directory."""
    # Look in parent directory (project root)
    project_root = os.path.join(os.path.dirname(__file__), '..')
    mdb_files = glob.glob(os.path.join(project_root, MDB_FILE_PATTERN))
    
    if not mdb_files:
        # Try current directory
        mdb_files = glob.glob(MDB_FILE_PATTERN)
    
    if mdb_files:
        return os.path.abspath(mdb_files[0])
    return None


def connect_access(mdb_path: str):
    """Connect to Access database using pyodbc."""
    import pyodbc
    conn_str = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={mdb_path};'
    return pyodbc.connect(conn_str)


def connect_postgres():
    """Connect to PostgreSQL database."""
    import psycopg2
    from psycopg2.extras import RealDictCursor
    
    # Try to load from .env file
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    key, value = line.strip().split('=', 1)
                    os.environ.setdefault(key, value.strip().strip('"').strip("'"))
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment or .env file")
    
    # Parse PostgreSQL connection string
    # Format: postgresql://user:password@host:port/database
    match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', database_url)
    if not match:
        # Try without port
        match = re.match(r'postgresql://([^:]+):([^@]+)@([^/]+)/(.+)', database_url)
        if match:
            user, password, host, database = match.groups()
            port = 5432
        else:
            raise ValueError(f"Unable to parse DATABASE_URL: {database_url}")
    else:
        user, password, host, port, database = match.groups()
        port = int(port)
    
    # Handle query params
    if '?' in database:
        database = database.split('?')[0]
    
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    return conn


def hash_password(password: str) -> str:
    """Hash password using bcrypt-compatible format (simplified for import)."""
    # In production, use proper bcrypt hashing
    # This is a placeholder - the app will require password reset
    return f"$2b$12$IMPORTED{hashlib.sha256(password.encode()).hexdigest()[:20]}"


def parse_parent_info(parent_str: str) -> Tuple[Optional[str], Optional[str]]:
    """Parse parent name string into father and mother names."""
    if not parent_str:
        return None, None
    
    # Common patterns: "Father / Mother" or "Father /Mother" or "Father/Mother"
    parts = re.split(r'\s*/\s*', parent_str)
    if len(parts) >= 2:
        father = parts[0].strip()
        mother = parts[1].strip()
        return father, mother
    
    return parent_str.strip(), None


def parse_phone(phone_str) -> Optional[str]:
    """Parse and normalize phone number."""
    if not phone_str:
        return None
    
    phone = str(phone_str).strip()
    # Remove any non-digit characters except + and /
    phone = re.sub(r'[^\d+/]', '', phone)
    
    # Handle multiple numbers (take first)
    if '/' in phone:
        phone = phone.split('/')[0]
    
    # Ensure it starts with country code or add Tunisian code
    if phone and not phone.startswith('+'):
        if phone.startswith('00'):
            phone = '+' + phone[2:]
        elif len(phone) == 8:  # Tunisian 8-digit number
            phone = '+216' + phone
    
    return phone if phone else None


def parse_grade(grade_str: str) -> Tuple[Optional[str], Optional[str]]:
    """Parse grade/class string."""
    if not grade_str:
        return None, None
    
    grade_str = grade_str.strip()
    
    # Check exact match
    if grade_str in GRADE_MAPPING:
        return GRADE_MAPPING[grade_str]
    
    # Partial match
    for arabic, (english, code) in GRADE_MAPPING.items():
        if arabic in grade_str or grade_str in arabic:
            return english, code
    
    return grade_str, None


def generate_email(first_name: str, last_name: str, user_type: str, index: int) -> str:
    """Generate a unique email address."""
    # Normalize names
    first = re.sub(r'[^\w]', '', first_name.lower())[:10] if first_name else 'unknown'
    last = re.sub(r'[^\w]', '', last_name.lower())[:10] if last_name else 'user'
    
    return f"{first}.{last}.{user_type}{index}@imported.school.tn"


def migrate_data():
    """Main migration function."""
    print("=" * 70)
    print("School Hub - Access Database Migration Tool")
    print("=" * 70)
    
    # Find MDB file
    mdb_path = get_mdb_file()
    if not mdb_path:
        print("❌ Error: No .mdb file found!")
        sys.exit(1)
    
    print(f"📁 Found MDB file: {os.path.basename(mdb_path)}")
    
    # Connect to databases
    print("\n🔌 Connecting to databases...")
    try:
        access_conn = connect_access(mdb_path)
        pg_conn = connect_postgres()
        print("✅ Connected to both databases")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)
    
    access_cursor = access_conn.cursor()
    pg_cursor = pg_conn.cursor()
    
    # Get or create role IDs
    print("\n📋 Setting up roles...")
    pg_cursor.execute("SELECT id, name FROM roles")
    roles = {row[1]: row[0] for row in pg_cursor.fetchall()}
    
    if 'student' not in roles:
        roles['student'] = str(uuid.uuid4())
        pg_cursor.execute("INSERT INTO roles (id, name) VALUES (%s, %s)", (roles['student'], 'student'))
    if 'parent' not in roles:
        roles['parent'] = str(uuid.uuid4())
        pg_cursor.execute("INSERT INTO roles (id, name) VALUES (%s, %s)", (roles['parent'], 'parent'))
    
    print(f"   Student role ID: {roles['student'][:8]}...")
    print(f"   Parent role ID: {roles['parent'][:8]}...")
    
    # Fetch all students from Access
    print("\n📥 Reading student data from Access...")
    access_cursor.execute("SELECT * FROM [Données élèves]")
    columns = [desc[0] for desc in access_cursor.description]
    students_data = access_cursor.fetchall()
    print(f"   Found {len(students_data)} students")
    
    # Statistics
    stats = {
        'students_created': 0,
        'parents_created': 0,
        'enrollments_created': 0,
        'classes_created': 0,
        'errors': []
    }
    
    # Track created items to avoid duplicates
    created_classes = {}  # grade_name -> class_id
    created_parents = {}  # parent_phone -> parent_id
    
    print("\n🔄 Migrating students...")
    
    for idx, row in enumerate(students_data, 1):
        # Convert row to dict
        student = dict(zip(columns, row))
        
        try:
            # Extract student info
            first_name = student.get('الإسم', '') or ''
            last_name = student.get('اللقب', '') or ''
            birth_date = student.get('تاريخ الولادة')
            birth_place = student.get('مكان الولادة', '') or ''
            gender = GENDER_MAPPING.get(student.get('الجنس', ''), 'male')
            grade_str = student.get('القسم', '') or ''
            
            # Parent info
            parent_str = student.get('الولي', '') or ''
            parent_phone = parse_phone(student.get('الهاتف'))
            parent_job = student.get('مهنة الولي', '') or ''
            address = student.get('العنوان', '') or ''
            
            # Parse parent names
            father_name, mother_name = parse_parent_info(parent_str)
            
            # Generate unique IDs
            student_id = str(uuid.uuid4())
            student_email = generate_email(first_name, last_name, 'student', idx)
            
            # Parse grade
            grade_name, grade_code = parse_grade(grade_str)
            
            # Insert student user
            pg_cursor.execute("""
                INSERT INTO users (id, email, password_hash, first_name, last_name, 
                                 phone, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                student_id,
                student_email,
                hash_password(DEFAULT_PASSWORD),
                first_name,
                last_name,
                None,  # Student phone (use parent's)
                'active'
            ))
            
            # Assign student role
            pg_cursor.execute("""
                INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)
            """, (student_id, roles['student']))
            
            stats['students_created'] += 1
            
            # Create or get class
            if grade_name and grade_name not in created_classes:
                class_id = str(uuid.uuid4())
                
                # Create a course for this grade level
                course_id = str(uuid.uuid4())
                pg_cursor.execute("""
                    INSERT INTO courses (id, code, name, description, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name RETURNING id
                """, (course_id, grade_code, grade_name, f"Primary school {grade_name}", True))
                
                # Create the class
                pg_cursor.execute("""
                    INSERT INTO classes (id, course_id, term, section, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                """, (class_id, course_id, SCHOOL_YEAR, 'A', True))
                
                created_classes[grade_name] = class_id
                stats['classes_created'] += 1
            
            # Enroll student in class
            if grade_name in created_classes:
                enrollment_id = str(uuid.uuid4())
                pg_cursor.execute("""
                    INSERT INTO class_enrollments (id, class_id, student_id, status, enrolled_at)
                    VALUES (%s, %s, %s, %s, NOW())
                """, (enrollment_id, created_classes[grade_name], student_id, 'active'))
                stats['enrollments_created'] += 1
            
            # Create parent if phone exists and not already created
            if parent_phone and parent_phone not in created_parents:
                parent_id = str(uuid.uuid4())
                parent_email = generate_email(father_name or 'parent', last_name, 'parent', idx)
                
                pg_cursor.execute("""
                    INSERT INTO users (id, email, password_hash, first_name, last_name, 
                                     phone, status, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                """, (
                    parent_id,
                    parent_email,
                    hash_password(DEFAULT_PASSWORD),
                    father_name or 'ولي التلميذ',
                    last_name,
                    parent_phone,
                    'active'
                ))
                
                # Assign parent role
                pg_cursor.execute("""
                    INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)
                """, (parent_id, roles['parent']))
                
                created_parents[parent_phone] = parent_id
                stats['parents_created'] += 1
            
            # Link student to parent
            if parent_phone and parent_phone in created_parents:
                pg_cursor.execute("""
                    INSERT INTO parent_students (parent_id, student_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (created_parents[parent_phone], student_id))
            
            # Progress indicator
            if idx % 50 == 0:
                print(f"   ... processed {idx}/{len(students_data)} students")
                pg_conn.commit()
        
        except Exception as e:
            stats['errors'].append(f"Row {idx}: {str(e)}")
            continue
    
    # Final commit
    pg_conn.commit()
    
    # Print summary
    print("\n" + "=" * 70)
    print("✅ Migration Complete!")
    print("=" * 70)
    print(f"\n📊 Statistics:")
    print(f"   Students created:     {stats['students_created']}")
    print(f"   Parents created:      {stats['parents_created']}")
    print(f"   Classes created:      {stats['classes_created']}")
    print(f"   Enrollments created:  {stats['enrollments_created']}")
    
    if stats['errors']:
        print(f"\n⚠️  Errors ({len(stats['errors'])}):")
        for err in stats['errors'][:10]:  # Show first 10 errors
            print(f"   - {err}")
        if len(stats['errors']) > 10:
            print(f"   ... and {len(stats['errors']) - 10} more")
    
    print(f"\n🔐 Default password for all imported users: {DEFAULT_PASSWORD}")
    print("   Users will need to reset their passwords on first login.")
    
    # Cleanup
    access_cursor.close()
    access_conn.close()
    pg_cursor.close()
    pg_conn.close()
    
    print("\n✅ Done!")


if __name__ == "__main__":
    migrate_data()
