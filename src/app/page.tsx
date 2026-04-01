import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from '@/components/LandingPage';

export const metadata = {
  title: 'ContentForg — AI Sales Content for B2B Teams',
  description:
    'Generate on-brand battle cards, one-pagers, and competitive analyses in 60 seconds. Built for sales teams who can\'t wait on marketing.',
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }
  return <LandingPage />;
}
