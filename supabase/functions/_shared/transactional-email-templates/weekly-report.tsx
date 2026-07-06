/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Gestão Master'

interface WeeklyReportProps {
  companyName?: string
  periodLabel?: string
  totalVgv?: string
  totalSales?: number
  totalCommission?: string
  topBroker?: string
  topBrokerVgv?: string
}

const WeeklyReportEmail = ({
  companyName,
  periodLabel,
  totalVgv,
  totalSales,
  totalCommission,
  topBroker,
  topBrokerVgv,
}: WeeklyReportProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Resumo semanal - {companyName ?? SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Resumo Semanal</Heading>
        <Text style={subtitle}>
          {companyName ?? SITE_NAME} • {periodLabel ?? ''}
        </Text>

        <Section style={card}>
          <Text style={label}>VGV total</Text>
          <Text style={value}>{totalVgv ?? 'R$ 0,00'}</Text>
        </Section>

        <Section style={card}>
          <Text style={label}>Vendas confirmadas</Text>
          <Text style={value}>{totalSales ?? 0}</Text>
        </Section>

        <Section style={card}>
          <Text style={label}>Comissão total</Text>
          <Text style={value}>{totalCommission ?? 'R$ 0,00'}</Text>
        </Section>

        <Hr style={hr} />

        <Text style={label}>Destaque da semana</Text>
        <Text style={highlight}>
          {topBroker ? `${topBroker} — ${topBrokerVgv}` : 'Sem vendas no período'}
        </Text>

        <Text style={footer}>
          Enviado automaticamente pela {SITE_NAME}. Acesse a plataforma para ver o relatório completo.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WeeklyReportEmail,
  subject: (data: Record<string, any>) =>
    `Resumo semanal ${data?.periodLabel ? `— ${data.periodLabel}` : ''}`.trim(),
  displayName: 'Relatório Semanal',
  previewData: {
    companyName: 'Imobiliária Exemplo',
    periodLabel: '29/jun a 05/jul',
    totalVgv: 'R$ 1.250.000,00',
    totalSales: 4,
    totalCommission: 'R$ 62.500,00',
    topBroker: 'Ana Souza',
    topBrokerVgv: 'R$ 480.000,00',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0F172A', margin: '0 0 6px' }
const subtitle = { fontSize: '13px', color: '#64748B', margin: '0 0 22px' }
const card = {
  backgroundColor: '#F8FAFC',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 10px',
}
const label = { fontSize: '12px', color: '#64748B', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.4px' }
const value = { fontSize: '20px', fontWeight: 'bold' as const, color: '#0F172A', margin: 0 }
const highlight = { fontSize: '16px', color: '#0F172A', fontWeight: 600, margin: '0 0 22px' }
const hr = { borderColor: '#E2E8F0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94A3B8', margin: '24px 0 0' }
