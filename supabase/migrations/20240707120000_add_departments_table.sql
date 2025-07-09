-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, name)
);

-- Migrate existing employee department strings to departments table
INSERT INTO departments (organization_id, name)
SELECT DISTINCT organization_id, department
FROM employees
WHERE department IS NOT NULL
  AND department <> ''
  AND NOT EXISTS (
    SELECT 1 FROM departments d
    WHERE d.organization_id = employees.organization_id
      AND d.name = employees.department
  ); 