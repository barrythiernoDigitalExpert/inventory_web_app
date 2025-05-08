import { redirect } from 'next/navigation';

export default function Home() {
  // Redirection vers la page de connexion
  redirect('/login');
  
  // Cette partie ne sera jamais exécutée en raison de la redirection
  return null;
}