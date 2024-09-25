// app/api/generate-pdf/route.ts

import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import Redis from 'ioredis';
import fs from 'fs'
import path from 'path'

type RedisData = {
  first_name: string,
  last_name: string,
  email: string,
  course_name: string,
  issued_date: string,
  style?: string,
} | null;

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || '');

const LATO_REGULAR_BASE64 = fs.readFileSync(path.resolve('./public/fonts/encoded-Lato-Regular.base64')).toString()
const LATO_BOLD_BASE64 = fs.readFileSync(path.resolve('./public/fonts/encoded-Lato-Bold.base64')).toString()
const LITERATA_REGULAR_BASE64 = fs.readFileSync(path.resolve('./public/fonts/encoded-Literata-Regular.base64')).toString()
const LITERATA_BOLD_BASE64 = fs.readFileSync(path.resolve('./public/fonts/encoded-Literata-Bold.base64')).toString()
const DANCING_SCRIPT_BASE64 = fs.readFileSync(path.resolve('./public/fonts/DancingScript-VariableFont_wght.base64')).toString()

const getImageBase64 = (imagePath: string): string => {
  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  return base64Image;
};

const addCustomFont = (doc: jsPDF) => {
  doc.addFileToVFS('Dacing-Script.ttf', DANCING_SCRIPT_BASE64);
  doc.addFont('Dacing-Script.ttf', 'Dacing-Script', 'normal');

  doc.addFileToVFS('Lato-Regular.ttf', LATO_REGULAR_BASE64)
  doc.addFont('Lato-Regular.ttf', 'Lato-Regular', 'normal');

  doc.addFileToVFS('Lato-Bold.ttf', LATO_BOLD_BASE64)
  doc.addFont('Lato-Bold.ttf', 'Lato-Bold', 'normal');

  doc.addFileToVFS('Literata-Regular.ttf', LITERATA_REGULAR_BASE64)
  doc.addFont('Literata-Regular.ttf', 'Literata-Regular', 'normal');

  doc.addFileToVFS('Literata-Bold.ttf', LITERATA_BOLD_BASE64)
  doc.addFont('Literata-Bold.ttf', 'Literata-Bold', 'normal');

  doc.setFont('Lato-Regular'); // ตั้งค่าฟอนต์ที่ต้องการใช้
};

// Helper function เพื่อดึงข้อมูลจาก Redis
const fetchDataById = async (id: string): Promise<RedisData> => {
  try {
    const key = `cert:${id}`
    const data = await redis.call('JSON.GET', key)
    console.log(`Query key:${key}, get data ${data}`)

    if (data) {
      return JSON.parse(data as string) as RedisData
    }

    // const data = await redis.get(`cert:${id}`);
    return null;
  } catch (error) {
    console.error('Error fetching data from Redis:', error);
    return null;
  }
};

function cmToPt(cm: number): number {
  const POINTS_PER_CM = 28.3464567; // จำนวนจุดใน 1 เซนติเมตร
  return cm * POINTS_PER_CM;
}

// Handler สำหรับ API Route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 });
  }

  // ดึงข้อมูลจาก Redis
  const redisData = await fetchDataById(id);

  if (!redisData) {
    return NextResponse.json({ error: 'Data not found for the provided ID.' }, { status: 404 });
  }

  const portfolioURL = `https://academy.natthapach.com/student/portfoilo?id=${id}`

  // สร้าง QR Code เป็น Data URL (PNG)
  let qrCodeDataURL: string;
  try {
    qrCodeDataURL = await QRCode.toDataURL(portfolioURL);
  } catch (error) {
    console.error('Error generating QR Code:', error);
    return NextResponse.json({ error: 'Failed to generate QR Code.' }, { status: 500 });
  }

  // สร้าง PDF ด้วย jsPDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth()
  const hight = doc.internal.pageSize.getHeight()

  console.log(`Page size ${width} x ${hight}`)
  addCustomFont(doc);


  const BG_DICT: Record<string, string | undefined> = {
    'O1': './public/templates/certificate-bg-1.png',
    'O2': './public/templates/certificate-bg-2.png',
  }

  const bgPath = BG_DICT[redisData.style || ''] || './public/templates/certificate-bg-1.png'
  path.resolve(bgPath);
  const bgBase64 = getImageBase64(bgPath);
  doc.addImage(bgBase64, 'PNG', 0, 0, width, hight)

  doc
    .setFontSize(54.2)
    .setTextColor('#242424')
    .setFont('Lato-Bold')
    .text(`CERTIFICATE`, width / 2, cmToPt(5.29), { align: 'center' });

  doc
    .setFontSize(21)
    .setTextColor('#103a74')
    .setFont('Lato-Regular')
    .text(`Of Accomplishment`, width / 2, cmToPt(6.84), { align: 'center' });

  doc
    .setFontSize(16)
    .setTextColor('#242424')
    .setFont('Lato-Regular')
    .text(`This certificate is presented to`, width / 2, cmToPt(8.93), { align: 'center' });

  doc
    .setFontSize(45)
    .setTextColor('#dfa734')
    .setFont('Dacing-Script')
    .text(`${redisData.first_name} ${redisData.last_name}`, width / 2, cmToPt(11.2), { align: 'center' });

  doc
    .setFontSize(16)
    .setTextColor('#3b3a3a')
    .setFont('Lato-Regular')
    .text(`For completed in the ${redisData.course_name}`, width / 2, cmToPt(13.48), { align: 'center' });
  doc
    .setFontSize(16)
    .setTextColor('#3b3a3a')
    .setFont('Lato-Regular')
    .text(`held by Arako Academy issue on 6 June 2025`, width / 2, cmToPt(14.25), { align: 'center' });
    
  doc
    .setFontSize(35)
    .setTextColor('#103a74')
    .setFont('Dacing-Script')
    .text(`Natthapach A.`, width / 2, cmToPt(16), { align: 'center' });
    
  doc
    .setFontSize(14.4)
    .setTextColor('#3b3a3a')
    .setFont('Literata-Bold')
    .text(`Natthapach Anuwattananon`, width / 2, cmToPt(16.91), { align: 'center' });
    
  doc
    .setFontSize(15)
    .setTextColor('#3b3a3a')
    .setFont('Literata-Regular')
    .text(`INNOVATION INSTRUCTOR`, width / 2, cmToPt(17.83), { align: 'center' });

  doc
    .setFontSize(14)
    .setTextColor('#3b3a3a')
    .setFont('Literata-Regular')
    .text(`Portfolio`, cmToPt(25.93), cmToPt(15.93), { align: 'center' });

  // doc.text(`Document Size: ${width} ${hight}`, 100, 50, { align: 'left' });

  // เพิ่มข้อมูลจาก Redis
  // doc.setFontSize(14);
  // doc.text(`Data: ${redisData} ${width} ${hight}`, 50, 100, { align: 'left' });

  // เพิ่ม QR Code
  doc.addImage(qrCodeDataURL, 'PNG', cmToPt(24.78), cmToPt(16.04), 65, 65);

  // เพิ่มลิงก์ที่กำหนดให้กับพื้นที่สี่เหลี่ยม
  // doc.setDrawColor(0, 0, 255).setLineWidth(1).rect(cmToPt(24.7), cmToPt(15.2), 70, 100)
  doc.link(cmToPt(24.7), cmToPt(15.2), 70, 100, { url: portfolioURL });
  // สร้าง PDF เป็น ArrayBuffer
  const pdfArrayBuffer = doc.output('arraybuffer');

  // แปลง ArrayBuffer เป็น Uint8Array
  const pdfUint8Array = new Uint8Array(pdfArrayBuffer);

  // แปลง Uint8Array เป็น Buffer
  const pdfBuffer = Buffer.from(pdfUint8Array);

  // ตั้งค่า headers สำหรับ PDF
  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `inline; filename=document-${id}.pdf`);

  // ส่ง PDF กลับไปยังผู้ใช้
  return new NextResponse(pdfBuffer, { headers });
}
