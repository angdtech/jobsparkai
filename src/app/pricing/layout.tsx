import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Affordable AI Resume Builder Plans',
  description: 'Choose the perfect plan for your career journey. Free resume builder with AI-powered features. Premium plans start at just $9.99/month. No hidden fees.',
  openGraph: {
    title: 'Pricing - JobSpark AI',
    description: 'Affordable AI-powered resume builder plans. Start free today.',
    url: 'https://jobsparkai.com/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
