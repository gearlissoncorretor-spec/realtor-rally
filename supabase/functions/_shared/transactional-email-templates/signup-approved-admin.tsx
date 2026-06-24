/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Gestão Master'
const ADMIN_EMAIL = 'gearlissoncorretor@gmail.com'

interface Props {
  fullName?: string
  email?: string
  approvedBy?: string
  approvedAt?: string
}

const SignupApprovedAdmin = ({ fullName, email, approvedBy, approvedAt }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Cadastro aprovado: {fullName ?? email}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Cadastro autorizado</Heading>
        <Text style={text}>
          O acesso do usuário abaixo foi <strong>aprovado</strong> na plataforma <strong>{SITE_NAME}</strong>.
        </Text>
        <Section style={box}>
          <Text style={row}><strong>Nome:</strong> {fullName ?? '—'}</Text>
          <Text style={row}><strong>E-mail:</strong> {email ?? '—'}</Text>
          {approvedBy && <Text style={row}><strong>Aprovado por:</strong> {approvedBy}</Text>}
          {approvedAt && <Text style={row}><strong>Aprovado em:</strong> {approvedAt}</Text>}
        </Section>
        <Text style={footer}>Confirmação automática do {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SignupApprovedAdmin,
  subject: 'Cadastro aprovado com sucesso',
  displayName: 'Admin: cadastro aprovado',
  to: ADMIN_EMAIL,
  previewData: { fullName: 'João Silva', email: 'joao@exemplo.com', approvedBy: 'Admin', approvedAt: new Date().toLocaleString('pt-BR') },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }
const box = { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '14px 18px', margin: '0 0 24px' }
const row = { fontSize: '14px', color: '#0F172A', margin: '4px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '30px 0 0' }
