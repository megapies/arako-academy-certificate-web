'use client'

import { Suspense } from 'react';
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Dancing_Script } from 'next/font/google'
// import axios from 'axios'

interface PortfolioData {
  course_name: string
  first_name: string
  last_name: string
  issued_date: string
  portfolio: string[]
}

const dancingScript = Dancing_Script({
  weight: ["700"],
  subsets: ['latin'],
  display: 'swap',
})

export default function StudentPortfolio() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
function PortfolioContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          setLoading(true)
          const response = { data: {
            course_name: 'Sample Midjourney',
            first_name: 'Jane',
            last_name: 'Forster',
            issued_date: '2024-05-24',
            portfolio: [
              'https://cdn.midjourney.com/dba0c74c-a0f5-49a9-b23c-fbb75fdad83e/0_2.png',
              'https://cdn.midjourney.com/011a7bf1-f46f-4a8b-9de2-035c64816e9d/0_3.png',
              'https://cdn.midjourney.com/011a7bf1-f46f-4a8b-9de2-035c64816e9d/0_3.png',
            ]
          }
        }
          // const response = await axios.get<PortfolioData>(`/api/portfolio?id=${id}`)
          setPortfolioData(response.data)
          setError(null)
        } catch (error) {
          console.error('Error fetching portfolio data:', error)
          setError('Failed to fetch portfolio data. Please try again later.')
        } finally {
          setLoading(false)
        }
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  if (!portfolioData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500 text-xl">No portfolio data found.</div>
      </div>
    )
  }

  const formattedDate = format(new Date(portfolioData.issued_date), 'd MMMM yyyy')

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#ffffff] to-[#dfdfdf] shadow-xl rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-8 sm:p-10 text-center">
            <h1 className="text-5xl font-bold text-[#242424] mb-6 tracking-widest">PORTFOLIO</h1>
            <p className="text-lg text-[#103a74] mb-2">This portfolio is presented to</p>
            <h2 className={`text-4xl font-bold text-[#dfa734] mb-4 ${dancingScript.className}`}>
              {portfolioData.first_name} {portfolioData.last_name}
            </h2>
            <p className="text-lg text-[#103a74] mb-6">
              for completing&nbsp;
              <b>

              {portfolioData.course_name}
              </b>
              <br/>
              held by&nbsp;
              <a href='https://www.youtube.com/@arako.academy' target='_blank'>
              <b>
               Arako Academy&nbsp;
              </b>
              </a>
              issued on {formattedDate}
            </p>
            <button className="bg-[#103a74] text-white hover:bg-[#042657] font-bold py-2 px-4 rounded transition duration-300">
              View Certificate
            </button>
          </div>

          {/* Portfolio Section */}
          <div className="px-6 py-8 sm:p-10 bg-gradient-to-br from-[#ffffff] to-[#efefef]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {portfolioData.portfolio.map((imageUrl, index) => (
                <div key={index} className="aspect-w-3 aspect-h-4">
                  <img src={imageUrl} className='rounded-lg'/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}