import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Maharashtra districts (top 10) from LGD
const MAHARASHTRA_DISTRICTS = [
  { code: "516", name: "Mumbai", stateCode: "27", stateName: "Maharashtra" },
  { code: "517", name: "Thane", stateCode: "27", stateName: "Maharashtra" },
  { code: "519", name: "Pune", stateCode: "27", stateName: "Maharashtra" },
  { code: "521", name: "Nashik", stateCode: "27", stateName: "Maharashtra" },
  { code: "523", name: "Aurangabad", stateCode: "27", stateName: "Maharashtra" },
  { code: "525", name: "Nagpur", stateCode: "27", stateName: "Maharashtra" },
  { code: "527", name: "Kolhapur", stateCode: "27", stateName: "Maharashtra" },
  { code: "529", name: "Solapur", stateCode: "27", stateName: "Maharashtra" },
  { code: "531", name: "Amravati", stateCode: "27", stateName: "Maharashtra" },
  { code: "533", name: "Jalgaon", stateCode: "27", stateName: "Maharashtra" },
  { code: "535", name: "Ahmednagar", stateCode: "27", stateName: "Maharashtra" },
  { code: "537", name: "Satara", stateCode: "27", stateName: "Maharashtra" },
  { code: "539", name: "Raigad", stateCode: "27", stateName: "Maharashtra" },
  { code: "541", name: "Sangli", stateCode: "27", stateName: "Maharashtra" },
  { code: "543", name: "Yavatmal", stateCode: "27", stateName: "Maharashtra" },
  { code: "545", name: "Beed", stateCode: "27", stateName: "Maharashtra" },
  { code: "547", name: "Dhule", stateCode: "27", stateName: "Maharashtra" },
  { code: "549", name: "Nandurbar", stateCode: "27", stateName: "Maharashtra" },
  { code: "551", name: "Wardha", stateCode: "27", stateName: "Maharashtra" },
  { code: "553", name: "Chandrapur", stateCode: "27", stateName: "Maharashtra" },
  { code: "555", name: "Gadchiroli", stateCode: "27", stateName: "Maharashtra" },
  { code: "557", name: "Hingoli", stateCode: "27", stateName: "Maharashtra" },
  { code: "559", name: "Parbhani", stateCode: "27", stateName: "Maharashtra" },
  { code: "561", name: "Nanded", stateCode: "27", stateName: "Maharashtra" },
  { code: "563", name: "Osmanabad", stateCode: "27", stateName: "Maharashtra" },
  { code: "565", name: "Ratnagiri", stateCode: "27", stateName: "Maharashtra" },
  { code: "567", name: "Sindhudurg", stateCode: "27", stateName: "Maharashtra" },
  { code: "569", name: "Washim", stateCode: "27", stateName: "Maharashtra" },
  { code: "571", name: "Bhandara", stateCode: "27", stateName: "Maharashtra" },
  { code: "573", name: "Gondia", stateCode: "27", stateName: "Maharashtra" },
  { code: "575", name: "Palghar", stateCode: "27", stateName: "Maharashtra" },
];

async function main() {
  console.log("Seeding LGD districts...");

  for (const district of MAHARASHTRA_DISTRICTS) {
    await prisma.lgdDistrict.upsert({
      where: { code: district.code },
      update: {},
      create: district,
    });
  }

  console.log(`Seeded ${MAHARASHTRA_DISTRICTS.length} districts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
