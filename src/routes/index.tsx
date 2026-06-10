import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Menu, X, Instagram, Facebook, MessageCircle, MapPin, ArrowRight, ArrowUp,
  Trophy, Truck, Star, Package, Tag, Check, Phone, Mail, Clock,
} from "lucide-react";

import logoAsset from "@/assets/bg-logo.png.asset.json";
import warehouseAsset from "@/assets/bg-warehouse.png.asset.json";
import storefront from "@/assets/storefront.jpg";
import schoolBg from "@/assets/school-supplies.jpg";
import phoneBg from "@/assets/phone-contact.jpg";
import catGrafico from "@/assets/cat-grafico.jpg";
import catLimpeza from "@/assets/cat-limpeza.jpg";
import catInformatica from "@/assets/cat-informatica.jpg";
import catEscritorio from "@/assets/cat-escritorio.jpg";
import catEscolar from "@/assets/cat-escolar.jpg";
import catEmbalagens from "@/assets/cat-embalagens.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BG Atacado — 65 anos servindo Passo Fundo/RS" },
      { name: "description", content: "Atacadista em Passo Fundo/RS: material escolar, escritório, limpeza, informática, gráfico e embalagens. 65 anos de tradição." },
    ],
  }),
  component: Index,
});

const WHATS_LINK = "https://wa.me/5554991242948";
const INSTA_LINK = "https://instagram.com/";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

function useScrolled(threshold = 30) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#inicio" className="flex items-center gap-3">
      <img src={logoAsset.url} alt="BG Atacado" width={44} height={44} className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5" />
      <div className="leading-tight">
        <div className={`font-display tracking-tight text-xl font-bold ${light ? "text-white" : "text-foreground"}`}>BG Atacado</div>
        <div className={`text-[10px] tracking-[0.22em] uppercase ${light ? "text-white/70" : "text-muted-foreground"}`}>Desde 1959</div>
      </div>
    </a>
  );
}

function Header() {
  const scrolled = useScrolled();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#inicio", label: "Início" },
    { href: "#sobre", label: "Sobre Nós" },
    { href: "#produtos", label: "Produtos" },
    { href: "#contato", label: "Contato" },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.06)]" : "bg-white/60 backdrop-blur-sm"
      }`}
    >
      <div className="container-wide flex items-center justify-between py-3">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 hover:text-primary-dark transition-colors">
              {l.label}
            </a>
          ))}
          <a href={INSTA_LINK} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-foreground/70 hover:text-primary-dark transition-colors">
            <Instagram size={20} />
          </a>
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <Menu />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <aside className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Fechar"><X /></button>
            </div>
            <div className="flex flex-col gap-5">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium">{l.label}</a>
              ))}
              <a href={INSTA_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-dark"><Instagram size={18} /> Instagram</a>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative min-h-screen pt-28 pb-16 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #F8FAF9 0%, #F2F5F3 100%)" }}>
      {/* decorative blobs */}
      <div className="absolute -right-32 top-24 w-[480px] h-[480px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #4CAF7D 0%, transparent 70%)" }} />
      <div className="absolute -left-20 bottom-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #2E8B57 0%, transparent 70%)" }} />

      <div className="container-wide grid lg:grid-cols-2 gap-12 items-center relative">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: "linear-gradient(90deg, #2E8B57, #4CAF7D)" }}>
            <Trophy size={14} /> 65 anos de tradição no mercado
          </span>
          <h1 className="mt-6 font-display tracking-tight font-bold text-[2.6rem] sm:text-5xl lg:text-[3.5rem] leading-[1.05] text-foreground">
            Uma história que se<br/>constrói <span className="not-italic font-extrabold" style={{ color: "var(--color-primary-dark)" }}>com você.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">
            Atacadista em Passo Fundo/RS com materiais escolares, de escritório, embalagens, limpeza e muito mais — qualidade e preço justo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#produtos" className="btn-primary">Conheça nossos produtos <ArrowRight size={18} /></a>
            <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-ghost"><MessageCircle size={18} /> Fale no WhatsApp</a>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-xl">
            {[
              { icon: Trophy, label: "Tradição e confiança" },
              { icon: Truck, label: "Entrega grátis acima de R$100" },
              { icon: Star, label: "Marcas reconhecidas" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm" style={{ color: "var(--color-primary-dark)" }}>
                  <Icon size={17} />
                </span>
                <span className="text-sm font-medium text-foreground/80 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] -z-10 opacity-60" style={{ background: "linear-gradient(135deg, #4CAF7D33, transparent)" }} />
          <img
            src={storefront}
            alt="Fachada da loja BG Atacado em Passo Fundo"
            width={1280} height={960}
            className="w-full h-[460px] lg:h-[560px] object-cover rounded-[1.75rem] shadow-2xl"
          />
          <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-gold)" }}>
              <Trophy className="text-white" size={22} />
            </div>
            <div>
              <div className="font-display tracking-tight text-2xl font-bold leading-none" style={{ color: "var(--color-primary-dark)" }}>65+</div>
              <div className="text-xs text-muted-foreground">anos de tradição</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: Truck, title: "Entrega gratuita", text: "Em Passo Fundo para compras acima de R$ 100,00" },
    { icon: Package, title: "+6 categorias", text: "Ampla variedade de produtos para você" },
    { icon: Tag, title: "Marcas reconhecidas", text: "Qualidade com preço justo no atacado" },
    { icon: MessageCircle, title: "Atendimento WhatsApp", text: "Tire suas dúvidas e faça pedidos" },
  ];
  return (
    <section style={{ background: "var(--color-primary-dark)" }} className="py-14">
      <div className="container-wide grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-2">
        {items.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className={`flex items-start gap-4 px-2 lg:px-6 ${i > 0 ? "lg:border-l lg:border-white/15" : ""}`}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white shrink-0">
              <Icon size={22} />
            </span>
            <div>
              <h3 className="text-white font-semibold text-base">{title}</h3>
              <p className="text-white/70 text-sm mt-1 leading-snug">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const start = performance.now(); const dur = 1500;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{v}{suffix}</span>;
}

function About() {
  return (
    <section id="sobre" className="py-24" style={{ background: "var(--color-background)" }}>
      <div className="container-wide grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp} className="relative">
          <img
            src={warehouseAsset.url}
            alt="Interior da loja BG Atacado"
            loading="lazy"
            className="w-full h-[520px] object-cover rounded-3xl shadow-xl"
          />
          <div className="absolute -bottom-7 -right-4 sm:-right-7 bg-white rounded-2xl px-6 py-5 shadow-2xl flex items-center gap-4 max-w-[260px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--color-gold)" }}>
              <Trophy className="text-white" size={26} />
            </div>
            <div>
              <div className="font-display tracking-tight text-base font-bold leading-tight" style={{ color: "var(--color-primary-dark)" }}>Tradição em Passo Fundo</div>
              <div className="text-xs text-muted-foreground mt-1">Atendimento de geração em geração</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={fadeUp}>
          <span className="section-label">Sobre nós</span>
          <h2 className="mt-3 font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight text-foreground">
            Servindo você com qualidade e dedicação
          </h2>
          <p className="mt-5 text-[17px] text-muted-foreground">
            Nossa loja em Passo Fundo/RS oferece uma ampla gama de produtos como materiais escolares, de escritório, embalagens e muito mais. Prezamos sempre pelo melhor atendimento, com os melhores preços e a melhor qualidade.
          </p>

          <ul className="mt-7 space-y-3.5">
            {["Atendimento personalizado", "Marcas reconhecidas no mercado", "Preços justos para atacado e varejo"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--color-primary-light)" }}>
                  <Check size={15} className="text-white" />
                </span>
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-6 max-w-sm">
            <div className="border-l-2 pl-4" style={{ borderColor: "var(--color-primary-light)" }}>
              <div className="font-display tracking-tight text-4xl font-bold" style={{ color: "var(--color-primary-dark)" }}>
                +<Counter to={65} />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">anos de mercado</div>
            </div>
            <div className="border-l-2 pl-4" style={{ borderColor: "var(--color-primary-light)" }}>
              <div className="font-display tracking-tight text-4xl font-bold" style={{ color: "var(--color-primary-dark)" }}>
                +<Counter to={6} />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">categorias</div>
            </div>
          </div>

          <a href="#contato" className="btn-primary mt-9">Conheça nossa história <ArrowRight size={18} /></a>
        </motion.div>
      </div>
    </section>
  );
}

const categories = [
  { name: "Material Gráfico", img: catGrafico },
  { name: "Material de Limpeza", img: catLimpeza },
  { name: "Linha Informática", img: catInformatica },
  { name: "Linha Escritório", img: catEscritorio },
  { name: "Material Escolar", img: catEscolar },
  { name: "Embalagens Alimentícias", img: catEmbalagens },
];

function Products() {
  return (
    <section id="produtos" className="py-24 bg-white">
      <div className="container-wide">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto">
          <span className="section-label">Nossos produtos</span>
          <h2 className="mt-3 font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-[2.6rem] leading-tight">
            Tudo o que você precisa, em um só lugar
          </h2>
          <p className="mt-4 text-[17px] text-muted-foreground">
            Trabalhamos com marcas reconhecidas no mercado, oferecendo qualidade e preço justo.
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {categories.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="card-product group"
            >
              <div className="mx-auto h-[150px] w-[150px] rounded-full overflow-hidden ring-4 ring-secondary group-hover:ring-primary-light/40 transition">
                <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="mt-6 font-display tracking-tight font-bold text-xl text-foreground">{c.name}</h3>
              <a href={WHATS_LINK} target="_blank" rel="noreferrer"
                 className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold transition"
                 style={{ color: "var(--color-primary-dark)" }}>
                Confira <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl px-8 py-10 sm:px-12 sm:py-12 flex flex-col md:flex-row items-center gap-6 justify-between"
          style={{ background: "linear-gradient(120deg, #1A5C3A 0%, #2E8B57 100%)" }}>
          <div className="text-white">
            <h3 className="font-display tracking-tight text-2xl sm:text-3xl font-bold">Não encontrou o que precisava?</h3>
            <p className="text-white/80 mt-1">Fale conosco pelo WhatsApp :)</p>
          </div>
          <a href={WHATS_LINK} target="_blank" rel="noreferrer" className="btn-light">
            <MessageCircle size={18} /> (54) 99124-2948
          </a>
        </div>
      </div>
    </section>
  );
}

function SchoolBanner() {
  return (
    <section className="relative py-28 overflow-hidden">
      <img src={schoolBg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "rgba(26, 92, 58, 0.78)" }} />
      <div className="relative container-wide text-center text-white max-w-3xl mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="font-display tracking-tight font-bold text-3xl sm:text-5xl leading-tight">Preparado para o próximo semestre?</h2>
          <p className="mt-5 text-white/85 text-lg">Nossos materiais escolares têm a qualidade que você procura!</p>
          <a href="#produtos" className="btn-light mt-8"><Package size={18} /> Confira nossos produtos</a>
        </motion.div>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section className="py-24" style={{ background: "var(--color-primary-dark)" }}>
      <div className="container-wide grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <MapPin size={26} />
          </span>
          <h2 className="mt-6 font-display tracking-tight font-bold text-3xl sm:text-4xl lg:text-[2.6rem]">Onde estamos</h2>
          <p className="mt-5 text-white/85 text-lg leading-relaxed">
            Rua Teixeira Soares, 172 — Centro<br/>Passo Fundo / RS — 99010-080
          </p>
          <a
            href="https://maps.google.com/?q=Rua+Teixeira+Soares,+172+-+Centro,+Passo+Fundo"
            target="_blank" rel="noreferrer"
            className="btn-light mt-8 inline-flex"
          >
            <MapPin size={18} /> Acessar mapa
          </a>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <iframe
            title="Mapa BG Atacado"
            src="https://maps.google.com/maps?q=Rua+Teixeira+Soares,+172+-+Centro,+Passo+Fundo&t=&z=15&ie=UTF8&iwloc=&output=embed"
            width="100%" height="380" loading="lazy"
            style={{ border: 0, display: "block" }}
          />
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contato" className="relative py-28 overflow-hidden">
      <img src={phoneBg} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,28,30,0.85), rgba(26,92,58,0.85))" }} />
      <div className="relative container-wide text-center text-white max-w-2xl mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <span className="section-label" style={{ color: "var(--color-primary-light)" }}>Contato</span>
          <h2 className="mt-3 font-display tracking-tight font-bold text-4xl sm:text-5xl">Quer saber mais?</h2>
          <p className="mt-5 text-white/85 text-lg">Fale com a gente agora pelo WhatsApp e tire suas dúvidas!</p>
          <a
            href={WHATS_LINK} target="_blank" rel="noreferrer"
            className="mt-9 inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all hover:scale-[1.03]"
            style={{ background: "var(--color-whatsapp)", boxShadow: "0 18px 40px -12px rgba(37,211,102,0.6)" }}
          >
            <MessageCircle size={22} /> (54) 99124-2948
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ background: "#1C1C1E" }} className="text-white/80">
      <div className="container-wide py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Logo light />
          <p className="mt-5 text-sm text-white/65 max-w-xs">
            História e dedicação servindo Passo Fundo com qualidade.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { Icon: Instagram, href: INSTA_LINK, label: "Instagram" },
              { Icon: Facebook, href: "#", label: "Facebook" },
              { Icon: MessageCircle, href: WHATS_LINK, label: "WhatsApp" },
            ].map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                 className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-primary-dark hover:text-white transition-colors">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-base mb-5">Menu</h4>
          <ul className="space-y-3 text-sm">
            {[
              ["#inicio", "Início"], ["#sobre", "Sobre Nós"], ["#produtos", "Produtos"], ["#contato", "Contato"],
            ].map(([h, l]) => (
              <li key={h}><a href={h} className="hover:text-primary-light transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-base mb-5">Fale Conosco</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><Phone size={16} className="mt-1 text-primary-light shrink-0" /><span>(54) 99124-2948<br/><a href="mailto:vendas@bgatacado.com" className="text-white/60 hover:text-white">vendas@bgatacado.com</a></span></li>
            <li className="flex items-start gap-2"><Phone size={16} className="mt-1 text-primary-light shrink-0" /><span>(54) 3316-3100<br/><a href="mailto:financeiro@bgatacado.com" className="text-white/60 hover:text-white">financeiro@bgatacado.com</a></span></li>
            <li className="flex items-start gap-2"><Clock size={16} className="mt-1 text-primary-light shrink-0" /><span className="text-white/70">Seg–Sex 08:00–12:00 / 13:30–18:30<br/>Sáb 08:30–12:00 · Dom Fechado</span></li>
            <li className="flex items-start gap-2"><Mail size={16} className="mt-1 text-primary-light shrink-0" /><span className="text-white/70">Rua Teixeira Soares, 172<br/>Centro · Passo Fundo/RS</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50" style={{ background: "#141416" }}>
        2024 © BG Atacado, TODOS OS DIREITOS RESERVADOS.
      </div>
    </footer>
  );
}

function FloatingButtons() {
  const scrolled = useScrolled(500);
  return (
    <>
      <a
        href={WHATS_LINK} target="_blank" rel="noreferrer" aria-label="Fale conosco no WhatsApp"
        className="whatsapp-pulse fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl group"
        style={{ background: "var(--color-whatsapp)" }}
      >
        <MessageCircle size={26} />
        <span className="hidden group-hover:block absolute right-16 bg-foreground text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap">Fale conosco!</span>
      </a>
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className="fixed bottom-24 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-xl hover:scale-110 transition-transform"
          style={{ background: "var(--color-primary-dark)" }}
        >
          <ArrowUp size={18} />
        </button>
      )}
    </>
  );
}

function Index() {
  return (
    <main>
      <Header />
      <Hero />
      <Benefits />
      <About />
      <Products />
      <SchoolBanner />
      <Location />
      <Contact />
      <Footer />
      <FloatingButtons />
    </main>
  );
}
