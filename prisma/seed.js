// prisma/seed.js — data contoh agar dashboard langsung terisi
// Jalankan: npm run db:seed   (data lama akan dihapus!)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addMonthsKeepDay = (base, n, day) => {
  const y = base.getFullYear();
  const m = base.getMonth() + n;
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last));
};
const periodFor = (moveIn, i) => {
  const day = moveIn.getDate();
  const start = addMonthsKeepDay(moveIn, i, day);
  const next = addMonthsKeepDay(moveIn, i + 1, day);
  return { start, end: new Date(next.getFullYear(), next.getMonth(), next.getDate() - 1) };
};
const monthsAgo = (n, day) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - n, day);
};

async function main() {
  await prisma.waLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.expense.deleteMany();

  const roomData = [
    ['Kamar A1', 'KAMAR', '', 1200000, 'AC, kamar mandi dalam, WiFi, kasur queen'],
    ['Kamar A2', 'KAMAR', '', 1200000, 'AC, kamar mandi dalam, WiFi, kasur queen'],
    ['Kamar A3', 'KAMAR', '', 1100000, 'AC, kamar mandi dalam, WiFi'],
    ['Kamar B1', 'KAMAR', '', 900000, 'Kipas angin, kamar mandi dalam, WiFi'],
    ['Kamar B2', 'KAMAR', '', 900000, 'Kipas angin, kamar mandi dalam, WiFi'],
    ['Kamar B3', 'KAMAR', '', 850000, 'Kipas angin, kamar mandi luar, WiFi'],
    ['Kamar C1', 'KAMAR', '', 750000, 'Kipas angin, kamar mandi luar'],
    ['Kamar C2', 'KAMAR', '', 750000, 'Kipas angin, kamar mandi luar'],
    ['Kios K1', 'KIOS', '3x4 m', 1800000, 'Rolling door, token 1300W, pinggir jalan utama'],
    ['Kios K2', 'KIOS', '3x4 m', 1800000, 'Rolling door, token 1300W, etalase kaca'],
    ['Kios K3', 'KIOS', '4x5 m', 2200000, 'Rolling door, token 2200W, kamar mandi dalam, parkiran luas'],
    ['Kios K4', 'KIOS', '3x3 m', 1500000, 'Rolling door, token 1300W, air PDAM'],
  ];
  const rooms = [];
  for (const [name, type, size, price, facility] of roomData)
    rooms.push(await prisma.room.create({ data: { name, type, size, price, facility } }));

  // [nama, hp, roomIdx, moveIn, jumlah periode terakhir yg BELUM dibayar, catatan]
  const tenantData = [
    ['Budi Santoso', '081234567801', 0, monthsAgo(9, 5), 0, 'Karyawan swasta'],
    ['Siti Nurhaliza', '081234567802', 1, monthsAgo(7, 15), 0, 'Mahasiswi'],
    ['Andi Pratama', '081234567803', 2, monthsAgo(5, 10), 1, 'Karyawan'],
    ['Dewi Lestari', '081234567804', 3, monthsAgo(4, 20), 1, 'Mahasiswi'],
    ['Rizky Ramadhan', '081234567805', 4, monthsAgo(3, 1), 2, 'Freelancer'],
    ['Putri Ayu', '081234567806', 6, monthsAgo(1, 25), 1, 'Mahasiswi'],
    ['Laundry Berkah (Pak Hendra)', '081234567807', 8, monthsAgo(6, 10), 0, 'Usaha Laundry Kiloan'],
    ['Kopi Senja (Mas Dimas)', '081234567808', 9, monthsAgo(4, 3), 0, 'Kedai Kopi & Roti Bakar'],
    ['Toko Sembako Makmur', '081234567809', 10, monthsAgo(2, 18), 1, 'Warung Sembako & Galon'],
  ];

  const today = new Date();
  const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  let counter = 1;

  for (const [name, phone, ri, moveIn, unpaidLast, note] of tenantData) {
    const room = rooms[ri];
    const t = await prisma.tenant.create({
      data: { name, phone, roomId: room.id, moveInDate: moveIn, note: note || 'Data contoh' },
    });
    const periods = [];
    for (let i = 0; i < 200; i++) {
      const p = periodFor(moveIn, i);
      if (p.start > limit) break;
      periods.push({ i, ...p });
    }
    for (const p of periods) {
      const isPaid = p.start <= today && p.i < periods.length - unpaidLast && p.start <= today;
      const paidAt = new Date(p.start.getFullYear(), p.start.getMonth(), p.start.getDate() + (p.i % 3), 10, 0);
      const inv = await prisma.invoice.create({
        data: {
          tenantId: t.id,
          periodIndex: p.i,
          periodStart: p.start,
          periodEnd: p.end,
          dueDate: p.start,
          amount: room.price,
        },
      });
      if (isPaid && paidAt <= today) {
        const ym = `${paidAt.getFullYear()}${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
        await prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: 'LUNAS',
            paidAt,
            method: ['TRANSFER', 'TUNAI', 'QRIS'][counter++ % 3],
            receiptNo: `KW/${ym}/${String(inv.id).padStart(5, '0')}`,
          },
        });
      }
    }
  }

  // pengeluaran 8 bulan terakhir
  for (let k = 0; k < 8; k++) {
    const items = [
      ['LISTRIK', 650000 + (k % 3) * 50000, 'Tagihan listrik PLN', 3],
      ['AIR', 180000 + (k % 2) * 20000, 'Tagihan PDAM', 5],
      ['INTERNET', 450000, 'Langganan WiFi 100 Mbps', 7],
      ['GAJI', 1000000, 'Gaji penjaga kost', 28],
      ['KEBERSIHAN', 150000, 'Iuran sampah & alat kebersihan', 10],
    ];
    if (k % 3 === 1) items.push(['PERBAIKAN', 350000, 'Servis AC / perbaikan keran', 16]);
    for (const [category, amount, note, day] of items) {
      const date = monthsAgo(k, day);
      if (date > today) continue;
      await prisma.expense.create({ data: { category, amount, note, date } });
    }
  }
  console.log('✅ Data contoh berhasil dibuat');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
