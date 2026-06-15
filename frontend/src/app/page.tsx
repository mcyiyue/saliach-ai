import { redirect } from 'next/navigation';

export default function Home() {
  // Secara default arahkan ke /chat
  redirect('/chat');
}
