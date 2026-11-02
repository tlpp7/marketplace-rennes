import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {site,isLive} from "@/lib/site";
import "./globals.css";
export const metadata:Metadata={title:{default:"Marché Rennes | Vêtements d’occasion",template:"%s | Marché Rennes"},description:site.description,robots:{index:isLive,follow:isLive}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body><Header/>{children}<Footer/></body></html>}
