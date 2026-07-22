import { Film, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
export default function Footer() {
    return (<footer className="mt-16 border-t border-white/10 bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <Film className="h-6 w-6 text-white"/>
              </span>
              <span className="text-xl font-display font-bold text-white">
                Cinema<span className="text-accent-400">ID</span>
              </span>
            </div>
            <p className="text-slate-400 mb-6 max-w-md">
              Premium movie going with curated showtimes, comfortable halls, quick checkout, and e-tickets ready before the lights go down.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Facebook className="h-5 w-5"/>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Twitter className="h-5 w-5"/>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Instagram className="h-5 w-5"/>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary-400 transition-colors">
                <Youtube className="h-5 w-5"/>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/movies" className="text-slate-400 hover:text-white transition-colors">
                  Movies
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Cinemas
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  Promotions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-slate-400">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent-400"/> Grand Indonesia, Jakarta</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent-400"/> +62 21 555 0199</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent-400"/> care@cinemaid.test</p>
            </div>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; {new Date().getFullYear()} CinemaID. Demo booking experience for KADA Project.</p>
        </div>
      </div>
    </footer>);
}
