import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us - Get Help with Your Resume',
  description: 'Need help with JobSpark AI? Contact our support team for assistance with resume building, account issues, or general inquiries. We\'re here to help you succeed.',
  openGraph: {
    title: 'Contact Us - JobSpark AI',
    description: 'Get help with your resume and career tools. Our support team is here for you.',
    url: 'https://jobsparkai.com/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
