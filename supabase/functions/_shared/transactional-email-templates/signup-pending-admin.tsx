/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Gestão Master'
const APPROVAL_URL = 'https://central.gestaomaster.app.br/gestao-usuarios'
const ADMIN_EMAIL = 'gearlissoncorretor@gmail.com'

interface Props {
  fullName?: string
  email?: string
  createdAt?: string
}

const SignupPendingAdmin = ({ fullName, email, createdAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo cadastro aguardando aprovação: {fullName ?? email}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Novo cadastro pendente</Heading>
        <Text style={text}>
          Um novo usuário solicitou acesso à plataforma <strong>{SITE_NAME}</strong> e está aguardando sua aprovação.
        </Text>
        <Section style={box}>
          <Text style={row}><strong>Nome:</strong> {fullName ?? '—'}</Text>
          <Text style={row}><strong>E-mail:</strong> {email ?? '—'}</Text>
          {createdAt && <Text style={row}><strong>Solicitado em:</strong> {createdAt}</Text>}
        </Section>
        <Button style={button} href={APPROVAL_URL}>Revisar e aprovar</Button>
        <Text style={footer}>Você está recebendo este aviso como administrador do {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SignupPendingAdmin,
  subject: 'Novo cadastro aguardando aprovação',
  displayName: 'Admin: novo cadastro pendente',
  to: ADMIN_EMAIL,
  previewData: { fullName: 'João Silva', email: 'joao@exemplo.com', createdAt: new Date().toLocaleString('pt-BR') },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const box = { background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px 18px', margin: '0 0 24px' }
const row = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const button = { backgroundColor: '#3B82F6', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '30px 0 0' }
