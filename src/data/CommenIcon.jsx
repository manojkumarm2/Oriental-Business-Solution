import { FaFacebookF } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { APP_CONFIG } from "../config/app.config";

export const commenIcon = [
    {
        id: 1,
        icon: <FaFacebookF />,
        path: APP_CONFIG.facebookLink
    },
    {
        id: 2,
        icon: <FaWhatsapp />,
        path: APP_CONFIG.whatsAppLink
    },
    {
        id: 3,
        icon: <FaLinkedin />,
        path: APP_CONFIG.linkedInLink
    },
    {
        id: 4,
        icon: <FaInstagram />,
        path: APP_CONFIG.instaLink
    }
]
