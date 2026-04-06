import logo from "@/public/logo.png"
import Image from "next/image"
import Link from "next/link"
import { ChartNoAxesColumn, Globe, LayoutDashboard, Sparkles } from "lucide-react"

const Sidebar = () => {
    const navLinks = [
        {
            text: "CRM",
            icon: <LayoutDashboard />,
            link: "/dashboard"
        },
        {
            text: "AI Insights",
            icon: <Sparkles />,
            link: "/dashboard/ai-insights",
        },
        {
            text: "Web Builder",
            icon: <Globe />,
            link: "/dashboard/web-builder"
        }
    ]

  return (
    <nav className="hidden xl:block xl:sticky top-0 left-0 h-screen w-[15%] bg-white border-r border-[#E5E7EB] px-4">
        <Link href={"/"} className="px-2 flex flex-col items-start py-3.5">
            <Image src={logo} alt='logo' width={35}/>
        </Link>

        <ul className="my-3 flex flex-col gap-2">
            {
                navLinks.map((item) => (
                    <li key={item.text}>
                        <Link href={item.link} className="text-[#96A5BA] p-2 rounded-md flex items-center gap-2 font-medium text-sm">
                            {item.icon}
                            <h3 className="text-[#274762]">{item.text}</h3>
                        </Link>
                    </li>

                ))
            }
        </ul>
    </nav>
  )
}

export default Sidebar
