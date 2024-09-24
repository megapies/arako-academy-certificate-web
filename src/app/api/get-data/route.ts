// app/api/get-data/route.ts

import { NextResponse } from 'next/server';
import Redis from 'ioredis';

type RedisData = string | null;

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || '');

// Helper function เพื่อดึงข้อมูลจาก Redis
const fetchDataById = async (id: string): Promise<RedisData> => {
  try {
    const data = await redis.get(id);
    return data;
  } catch (error) {
    console.error('Error fetching data from Redis:', error);
    return null;
  }
};

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

  return NextResponse.json({ data: redisData }, { status: 200 });
}
