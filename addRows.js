const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'app/dashboard/clients/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Generate 20 rows
const clientNames = [
  "Tan Wei Ming", "Chen Li Na", "Raj Kumar", "Siti Aishah", "David Wong",
  "Priya Sharma", "Mohamed Ali", "Jessica Tan", "Kumar Suresh", "Anita Lim",
  "Robert Chen", "Nurul Huda", "Samuel Lee", "Mei Ling", "Vikram Patel",
  "Sophia Ng", "Arjun Singh", "Clara Koh", "Benjamin Teo", "Fatimah Binte"
];
const companyNames = [
  "Tech Solutions", "Global Traders", "Medical Group", "Consulting Partners", "Retail Chain",
  "Manufacturing Inc", "Logistics Co", "Finance Corp", "Real Estate Ltd", "Hospitality Group",
  "Education Center", "Healthcare Pte", "Construction Ltd", "Food Services", "Transportation",
  "Energy Solutions", "Media Group", "Pharmaceuticals", "Agriculture Co", "Telecom Ltd"
];
const clientTypes = ["SME", "Individual", "Corporate", "SME", "Individual", "Corporate", "SME", "Individual", "Corporate", "SME"];
const policyCounts = ["1", "2", "3", "4", "5", "—", "1", "2", "3", "—"];
const renewalDates = ["20 Apr", "25 Apr", "30 Apr", "5 May", "10 May", "15 May", "20 May", "25 May", "30 May", "New"];
const premiums = ["$2,500/yr", "$3,800/yr", "$5,200/yr", "$4,100/yr", "$6,900/yr", "$8,300/yr", "$1,800/yr", "$9,500/yr", "$7,200/yr", "—"];
const statuses = ["Active", "Renewal urgent", "Gap detected", "Active", "Claim open", "Intake active", "Active", "Renewal urgent", "Gap detected", "Intake active"];
const statusClasses = ["pill-ok", "pill-danger", "pill-amber", "pill-ok", "pill-danger", "pill-amber", "pill-ok", "pill-danger", "pill-amber", "pill-amber"];

let newRows = '';

for (let i = 0; i < 20; i++) {
  const rowNum = i + 6;
  const clientIdx = i % clientNames.length;
  const companyIdx = i % companyNames.length;
  const typeIdx = i % clientTypes.length;
  const policyIdx = i % policyCounts.length;
  const renewalIdx = i % renewalDates.length;
  const premiumIdx = i % premiums.length;
  const statusIdx = i % statuses.length;
  
  // Determine color for renewal date
  const renewalText = renewalDates[renewalIdx];
  let renewalColor = "#C9B99A";
  if (renewalText === "New") {
    renewalColor = "#5A8AD4";
  } else if (renewalText.includes("Apr") || renewalText.includes("May")) {
    renewalColor = "#D06060";
  }
  
  newRows += `                {/* Row ${rowNum} */}
                <tr className="hover:bg-cream-dim/5" style={{ height: '56px' }}>
                  <td className="px-6 py-4" style={{ textAlign: 'left' }}>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#F5ECD7',
                    }}>
                      ${clientNames[clientIdx]}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: '11px',
                      color: '#C9B99A',
                      marginTop: '2px',
                    }}>
                      ${companyNames[companyIdx]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`\${dmSans.className} text-sm text-cream-dim\`}>${clientTypes[typeIdx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`\${dmSans.className} text-sm text-cream-dim\`}>${policyCounts[policyIdx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '12px',
                      color: '${renewalColor}',
                    }}>
                      ${renewalText}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`\${dmSans.className} text-sm text-cream-dim\`}>${premiums[premiumIdx]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="pill ${statusClasses[statusIdx]}">${statuses[statusIdx]}</span>
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
                </tr>
`;
}

// Find the insertion point - after James Ong row's closing </tr> and before </tbody>
const insertionMarker = '</tr>\n              </tbody>';
const insertionIndex = content.indexOf(insertionMarker);

if (insertionIndex === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Insert the new rows
const newContent = content.substring(0, insertionIndex + '</tr>\n'.length) + 
                  newRows + 
                  content.substring(insertionIndex + '</tr>\n'.length);

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf8');

console.log(`Added 20 new rows (rows 6-25)`);

// Count total rows
const rowCount = (newContent.match(/{\/\* Row \d+ \*\/}/g) || []).length;
console.log(`Total rows in table: ${rowCount}`);