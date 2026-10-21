'use client';



import { useEffect, useState } from 'react';

import { MessageCircle } from 'lucide-react';

import { buildCourseSupportUrl } from '../lib/courseSupportWhatsApp';



type CourseSupportFabProps = {

  courseName: string;

  studentName?: string;

  /** area-nav = grabaciones móvil (nav áreas abajo); section-nav = tabs sección */

  bottomOffset?: 'area-nav' | 'section-nav';

};



export default function CourseSupportFab({

  courseName,

  studentName,

  bottomOffset = 'section-nav',

}: CourseSupportFabProps) {

  const [url, setUrl] = useState<string | null>(null);



  useEffect(() => {

    setUrl(buildCourseSupportUrl(courseName, studentName));

  }, [courseName, studentName]);



  if (!url) return null;



  const bottomClass =

    bottomOffset === 'area-nav'

      ? 'bottom-[calc(var(--recordings-area-nav-lift,4.5rem)+env(safe-area-inset-bottom,0px)+0.35rem)]'

      : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]';



  return (

    <a

      href={url}

      target="_blank"

      rel="noopener noreferrer"

      className={`fixed ${bottomClass} right-4 z-[52] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:right-6`}

      aria-label="Contactar soporte por WhatsApp"

    >

      <MessageCircle className="h-6 w-6" aria-hidden />

    </a>

  );

}

