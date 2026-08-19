"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import Image from "next/image";

export function Hero17() {
  return (
    <section className="flex min-h-screen w-full items-start bg-white px-4 py-12 sm:px-6 lg:items-center lg:px-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <div className="flex flex-col gap-6 sm:gap-7">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
                <Sparkles className="h-3.5 w-3.5" />
                Free shipping this week
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl leading-[1.1] font-medium tracking-[-0.01em] text-neutral-900 sm:text-4xl md:text-5xl dark:text-white"
            >
              Daily rituals for deeper
              <br />
              focus and calmer mornings.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="max-w-sm text-sm leading-relaxed text-neutral-600 sm:text-base dark:text-neutral-400"
            >
              A small-batch tea, a hand-poured candle, and a linen-bound
              journal, crafted to slow your pace and make space for what
              actually matters.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full cursor-pointer rounded-full bg-neutral-900 px-7 py-3.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-800 sm:w-auto sm:px-8 sm:text-base dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Shop the Ritual Set
              </motion.button>
            </motion.div>
          </div>

          <div className="flex flex-col gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.25 }}
              className="w-full overflow-hidden rounded-2xl"
              style={{ aspectRatio: "16/10" }}
            >
              <Image
                src="https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1200&h=750&fit=crop"
                alt="Morning ritual setup"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  src: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop",
                  alt: "Hand-poured candle",
                },
                {
                  src: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop",
                  alt: "Small-batch tea",
                },
                {
                  src: "https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?w=400&h=400&fit=crop",
                  alt: "Linen-bound journal",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 + i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded-xl"
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 17vw, 33vw"
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero17;
