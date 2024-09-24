// app/doc/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

const DocPage: React.FC = () => {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [data, setData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          const response = await fetch(`/api/get-data?id=${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch data.');
          }
          const result = await response.json();
          setData(result.data);
        } catch (err: unknown) {
          console.error(err);
          if (err instanceof Error) {
            setError(err.message || 'Unable to fetch data.');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      setError('No ID provided.');
      setLoading(false);
    }
  }, [id]);

  const generatePDF = async () => {
    if (!id) {
      setError('No ID provided.');
      return;
    }

    try {
      // สร้าง QR Code เป็น Data URL
      const qrCodeDataURL = await QRCode.toDataURL(`https://img.com/${id}`);

      const doc = new jsPDF();

      // เพิ่มข้อความ
      doc.setFontSize(25);
      doc.text(`Document ID: ${id}`, 105, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.text(`Data: ${data}`, 20, 40);

      doc.text('Scan the QR code below to visit the URL:', 20, 60);

      // เพิ่ม QR Code เป็นรูปภาพ
      doc.addImage(qrCodeDataURL, 'PNG', 20, 70, 50, 50);

      // สร้าง Blob จาก PDF
      const pdfBlob = doc.output('blob');
      const pdfBlobUrl = URL.createObjectURL(pdfBlob);

      // เปิด PDF ในหน้าต่างใหม่
      window.open(pdfBlobUrl);

      // หรือดาวน์โหลด PDF โดยอัตโนมัติ
      // doc.save(`document-${id}.pdf`);
    } catch (err: unknown) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF.');
    }
  };

  useEffect(() => {
    if (!loading && !error && id) {
      generatePDF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, id]);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <h1>Document ID: {id}</h1>
          <p>Generating PDF...</p>
        </>
      )}
    </div>
  );
};

export default DocPage;
