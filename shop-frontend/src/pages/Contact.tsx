import React from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";

const Contact = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50 px-6 py-20 flex flex-col items-center">
      <div className="w-full max-w-5xl mb-10">
        <Breadcrumbs />
      </div>

      {/* TITLE */}
      <h1 className="text-4xl font-bold text-green-700 mb-10">
        Liên hệ với chúng tôi
      </h1>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* LEFT */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

          <h2 className="text-2xl font-semibold text-gray-800">
            Thông tin liên hệ
          </h2>

          {/* PHONE */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <Phone className="w-6 h-6 text-green-600" />
            </div>

            <div>
              <p className="font-medium text-gray-700">
                Số điện thoại
              </p>

              <p className="text-gray-600">
                0945 079 155
              </p>
            </div>
          </div>

          {/* EMAIL */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <Mail className="w-6 h-6 text-green-600" />
            </div>

            <div>
              <p className="font-medium text-gray-700">
                Email
              </p>

              <p className="text-gray-600">
                bepmam@gmail.com
              </p>
            </div>
          </div>

          {/* ADDRESS */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-100">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>

            <div>
              <p className="font-medium text-gray-700">
                Địa chỉ
              </p>

              <p className="text-gray-600">
                209 Kim Mã, Ba Đình, Hà Nội
              </p>
            </div>
          </div>

          <p className="text-gray-500 leading-relaxed pt-4">
            Hãy nhắn cho chúng tôi qua các nền tảng bên cạnh để được phản hồi
            nhanh chóng trong vòng 10 phút.
          </p>
        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center">

          <h2 className="text-2xl font-semibold text-gray-800 mb-8">
            Nhắn tin với chúng tôi
          </h2>

          <div className="flex gap-8">

            {/* FACEBOOK */}
            <a
              href="https://www.facebook.com/Bepmamthuanchay?locale=vi_VN"
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                className="w-7 h-7 fill-white"
              >
                <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06H297V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
              </svg>
            </a>

            {/* ZALO */}
            <a
              href="https://zalo.me/0348086092"
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </a>

            {/* INSTAGRAM */}
            <a
              href="https://www.instagram.com/bepmam_hanoi"
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-7 h-7 fill-white"
              >
                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9S160.5 370.8 224.1 370.8 339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.3 0-74.7-33.4-74.7-74.7s33.4-74.7 74.7-74.7 74.7 33.4 74.7 74.7-33.4 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.9-26.9 26.9-14.9 0-26.9-12-26.9-26.9 0-14.9 12-26.9 26.9-26.9 14.9 0 26.9 12 26.9 26.9zM398.8 80c-22.1-22.1-51.3-34.2-82.5-34.2H131.7C65.5 45.8 12 99.3 12 165.5v180.9c0 66.2 53.5 119.7 119.7 119.7h184.6c31.2 0 60.4-12.1 82.5-34.2 22.1-22.1 34.2-51.3 34.2-82.5V162.5c0-31.2-12.1-60.4-34.2-82.5z" />
              </svg>
            </a>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-500">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7 💚
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;