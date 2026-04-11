#!/usr/bin/env python3
import re

# Read the file
with open('app/dashboard/clients/page.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with James Ong row closing tag
insertion_point = -1
for i, line in enumerate(lines):
    if 'James Ong' in line and '</tr>' in lines[i+20]:  # James Ong is in the row, </tr> comes later
        # Look ahead for the </tr>
        for j in range(i, min(i+30, len(lines))):
            if '</tr>' in lines[j]:
                insertion_point = j
                print(f"Found insertion point at line {insertion_point+1}: {lines[insertion_point].strip()}")
                break
        break

if insertion_point == -1:
    print("Could not find insertion point")
    exit(1)

# Generate 20 rows
new_rows = []
client_names = [
    "Tan Wei Ming", "Chen Li Na", "Raj Kumar", "Siti Aishah", "David Wong",
    "Priya Sharma", "Mohamed Ali", "Jessica Tan", "Kumar Suresh", "Anita Lim",
    "Robert Chen", "Nurul Huda", "Samuel Lee", "Mei Ling", "Vikram Patel",
    "Sophia Ng", "Arjun Singh", "Clara Koh", "Benjamin Teo", "Fatimah Binte"
]
company_names = [
    "Tech Solutions", "Global Traders", "Medical Group", "Consulting Partners", "Retail Chain",
    "Manufacturing Inc", "Logistics Co", "Finance Corp", "Real Estate Ltd", "Hospitality Group",
    "Education Center", "Healthcare Pte", "Construction Ltd", "Food Services", "Transportation",
    "Energy Solutions", "Media Group", "Pharmaceuticals", "Agriculture Co", "Telecom Ltd"
]
client_types = ["SME", "Individual", "Corporate", "SME", "Individual", "Corporate", "SME", "Individual", "Corporate", "SME"]
policy_counts = ["1", "2", "3", "4", "5", "—", "1", "2", "3", "—"]
renewal_dates = ["20 Apr", "25 Apr", "30 Apr", "5 May", "10 May", "15 May", "20 May", "25 May", "30 May", "New"]
premiums = ["$2,500/yr", "$3,800/yr", "$5,200/yr", "$4,100/yr", "$6,900/yr", "$8,300/yr", "$1,800/yr", "$9,500/yr", "$7,200/yr", "—"]
statuses = ["Active", "Renewal urgent", "Gap detected", "Active", "Claim open", "Intake active", "Active", "Renewal urgent", "Gap detected", "Intake active"]
status_classes = ["pill-ok", "pill-danger", "pill-amber", "pill-ok", "pill-danger", "pill-amber", "pill-ok", "pill-danger", "pill-amber", "pill-amber"]

for i in range(20):
    row_num = i + 6
    client_idx = i % len(client_names)
    company_idx = i % len(company_names)
    type_idx = i % len(client_types)
    policy_idx = i % len(policy_counts)
    renewal_idx = i % len(renewal_dates)
    premium_idx = i % len(premiums)
    status_idx = i % len(statuses)
    
    # Determine color for renewal date
    renewal_text = renewal_dates[renewal_idx]
    if renewal_text == "New":
        renewal_color = "#5A8AD4"
    elif "Apr" in renewal_text or "May" in renewal_text:
        renewal_color = "#D06060"
    else:
        renewal_color = "#C9B99A"
    
    # Build the row
    row = f'''                {/* Row {row_num} */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td className="px-6 py-4" style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      {client_names[client_idx]}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      {company_names[company_idx]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${{dmSans.className}} text-sm text-cream-dim`}>{client_types[type_idx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${{dmSans.className}} text-sm text-cream-dim`}>{policy_counts[policy_idx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '{renewal_color}',
                    }}>
                      {renewal_text}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${{dmSans.className}} text-sm text-cream-dim`}>{premiums[premium_idx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="pill {status_classes[status_idx]}">{statuses[status_idx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span style={{
                      color: '#C9B99A',
                      fontSize: '18px',
                      cursor: 'pointer',
                      letterSpacing: '3px',
                    }}>
                      ···
                    </span>
                  </td>
                </tr>'''
    
    # Fix the template literal - replace the double curly braces
    row = row.replace('${{dmSans.className}}', '${dmSans.className}')
    new_rows.append(row)

# Insert the new rows after the insertion point
lines = lines[:insertion_point+1] + ['\n'] + new_rows + lines[insertion_point+1:]

# Write back to file
with open('app/dashboard/clients/page.tsx', 'w') as f:
    f.writelines(lines)

print(f"Added {len(new_rows)} new rows (rows 6-25)")

# Count total rows
with open('app/dashboard/clients/page.tsx', 'r') as f:
    content = f.read()
    row_count = content.count('{/* Row ')
    print(f"Total rows in table: {row_count}")