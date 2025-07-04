'use client'

import React from 'react'
import { Dock } from './dock'
import { DockIcon } from './dock-icon'
import { Home, PenLine } from 'lucide-react'
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { BsMoonStars } from 'react-icons/bs'

export const DockDemo = () => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white">
        GitHub
      </div>
      <Dock>
        <DockIcon label="Home">
          <Home className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="Write">
          <PenLine className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="GitHub">
          <FaGithub className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="LinkedIn">
          <FaLinkedin className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="Twitter">
          <FaTwitter className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="Email">
          <MdEmail className="h-6 w-6" />
        </DockIcon>
        <DockIcon label="Theme">
          <BsMoonStars className="h-6 w-6" />
        </DockIcon>
      </Dock>
    </div>
  )
} 