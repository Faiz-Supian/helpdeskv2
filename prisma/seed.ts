import { prisma } from "../lib/prisma";

async function main() {
  await prisma.aduan.deleteMany();

  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000);

  await prisma.aduan.createMany({
    data: [
      {
        pengadu: "Ahmad Faris bin Roslan",
        lokasi: "Blok A - Bilik Kuliah 3",
        kategori_kerosakan: "Penyaman Udara",
        tahap_keutamaan: "Kritikal",
        status: "Baru",
        createdAt: hoursAgo(2),
      },
      {
        pengadu: "Nurul Izzah binti Zulkifli",
        lokasi: "Makmal Komputer 4 - Fakulti Kejuruteraan",
        kategori_kerosakan: "Wi-Fi/Rangkaian",
        tahap_keutamaan: "Kritikal",
        status: "Dalam Tindakan",
        createdAt: hoursAgo(5),
      },
      {
        pengadu: "Muhammad Hafizuddin bin Azman",
        lokasi: "Perpustakaan Utama - Aras 2 Zon Bacaan",
        kategori_kerosakan: "Elektrik/Lampu",
        tahap_keutamaan: "Sederhana",
        status: "Baru",
        createdAt: hoursAgo(9),
      },
      {
        pengadu: "Siti Aisyah binti Kamarudin",
        lokasi: "Kolej Kediaman Tun Fatimah - Blok B2",
        kategori_kerosakan: "Paip/Air",
        tahap_keutamaan: "Kritikal",
        status: "Dalam Tindakan",
        createdAt: hoursAgo(14),
      },
      {
        pengadu: "Lim Wei Jie",
        lokasi: "Dewan Kuliah Pusat (DKP 1)",
        kategori_kerosakan: "Penyaman Udara",
        tahap_keutamaan: "Sederhana",
        status: "Baru",
        createdAt: hoursAgo(22),
      },
      {
        pengadu: "Kavitha a/p Subramaniam",
        lokasi: "Blok C - Bilik Seminar 2",
        kategori_kerosakan: "Perabot",
        tahap_keutamaan: "Rendah",
        status: "Selesai",
        createdAt: hoursAgo(30),
      },
      {
        pengadu: "Wan Amirul Hakim bin Wan Yusof",
        lokasi: "Pejabat Pentadbiran - Kaunter Pelajar",
        kategori_kerosakan: "Wi-Fi/Rangkaian",
        tahap_keutamaan: "Sederhana",
        status: "Selesai",
        createdAt: hoursAgo(42),
      },
      {
        pengadu: "Norazlina binti Mohd Noor",
        lokasi: "Kafeteria Siswa - Zon Timur",
        kategori_kerosakan: "Paip/Air",
        tahap_keutamaan: "Sederhana",
        status: "Dalam Tindakan",
        createdAt: hoursAgo(50),
      },
      {
        pengadu: "Daniel Tan Yong Sheng",
        lokasi: "Makmal Fizik Gunaan - Aras 1",
        kategori_kerosakan: "Elektrik/Lampu",
        tahap_keutamaan: "Rendah",
        status: "Baru",
        createdAt: hoursAgo(64),
      },
      {
        pengadu: "Zainab binti Hashim",
        lokasi: "Surau Al-Hikmah - Ruang Solat Utama",
        kategori_kerosakan: "Lain-lain",
        tahap_keutamaan: "Rendah",
        status: "Selesai",
        createdAt: hoursAgo(80),
      },
    ],
  });

  console.log("Seeded 10 facility damage records into Aduan table.");
}

main()
  .catch((error) => {
    console.error("Failed to seed database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
