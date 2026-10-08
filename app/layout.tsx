import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'WikiCartes — Collection Wikipédia',description:'Collectionnez des cartes illustrées issues de Wikipédia.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
