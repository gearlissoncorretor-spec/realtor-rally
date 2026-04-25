/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Gestão Master'
const SITE_URL = 'https://central.gestaomaster.app.br'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo(a) à {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Olá, ${name}!` : 'Bem-vindo(a)!'}
        </Heading>
        <Text style={text}>
          Sua conta na <strong>{SITE_NAME}</strong> está pronta. Acesse a plataforma e comece a gerenciar sua equipe imobiliária com inteligência.
        </Text>
        <Button style={button} href={SITE_URL}>
          Acessar plataforma
        </Button>
        <Text style={footer}>
          Se você não criou esta conta, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Bem-vindo(a) à Gestão Master',
  displayName: 'Boas-vindas',
  previewData: { name: 'Maria' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 25px' }
const button = {
  backgroundColor: '#3B82F6',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#94A3B8', margin: '30px 0 0' }
