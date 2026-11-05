import {Img, Line, Node, Rect, Txt, View2D} from '@canvas-commons/2d';
import {
  all,
  createRef,
  delay,
  sequence,
  ThreadGenerator,
  waitFor,
  waitUntil,
} from '@canvas-commons/core';
import {fontes, logo, pesos, tamanhos, useTema} from '@synapticon/brand';
import {Anunciador} from '../base/Anunciador';
import {Moldura} from '../base/Destaque';
import {aparecer, curvas, ritmo, sumir} from '../tempo';

/*
 * Blocos de estrutura dos episódios (estilo Telecurso: situação → conceito → retomada).
 *
 * Cada bloco:
 *  1. entra sozinho;
 *  2. espera um EVENTO com nome — ele aparece na linha do tempo do editor e
 *     você arrasta até o ponto certo da narração;
 *  3. sai e limpa o que criou.
 *
 * Use dentro de qualquer cena: `yield* capitulo(view, {...})`.
 * Se a mesma cena usar o mesmo bloco duas vezes, passe `evento` diferente.
 */

// ───────────────────────────── Abertura ─────────────────────────────

export interface OpcoesAbertura {
  /** Código do treinamento. Ex.: 'BT-01'. */
  codigo: string;
  titulo: string;
  /** Linha acima do código. Padrão: 'SYNAPTICON LABORATORIES · TREINAMENTO BÁSICO'. */
  sobretitulo?: string;
  /** Evento de saída. Padrão: 'abertura-sai'. */
  evento?: string;
}

/** Vinheta de abertura: logo, código e título do treinamento. */
export function* abertura(view: View2D, opcoes: OpcoesAbertura): ThreadGenerator {
  const tema = useTema();
  const {
    codigo,
    titulo,
    sobretitulo = 'SYNAPTICON LABORATORIES · TREINAMENTO BÁSICO',
    evento = 'abertura-sai',
  } = opcoes;
  const grupo = createRef<Node>();
  const marca = createRef<Img>();
  const textos = createRef<Node>();
  const regua = createRef<Line>();

  view.add(
    <Node ref={grupo}>
      <Img ref={marca} src={logo('mark', tema.logo)} height={160} y={-170} opacity={0} />
      <Node ref={textos} y={40}>
        <Txt
          text={sobretitulo}
          y={-40}
          fontFamily={fontes.display}
          fontSize={tamanhos.mini}
          fontWeight={pesos.semi}
          letterSpacing={4}
          fill={tema.suave}
          opacity={0}
        />
        <Txt
          text={codigo}
          y={40}
          fontFamily={fontes.mono}
          fontSize={tamanhos.subtitulo}
          fill={tema.destaque}
          opacity={0}
        />
        <Txt
          text={titulo}
          y={130}
          fontFamily={fontes.display}
          fontSize={tamanhos.titulo}
          fontWeight={pesos.negrito}
          fill={tema.tinta}
          opacity={0}
        />
      </Node>
      <Line ref={regua} points={[[-360, 200], [360, 200]]} stroke={tema.destaque} lineWidth={4} end={0} />
    </Node>,
  );

  yield* aparecer(marca(), ritmo.normal);
  yield* sequence(0.12, ...textos().children().map(t => aparecer(t, ritmo.normal)));
  yield* regua().end(1, ritmo.normal, curvas.suave);

  yield* waitUntil(evento);
  yield* sumir(grupo(), ritmo.normal);
  grupo().remove();
}

// ───────────────────────────── Capítulo ─────────────────────────────

export interface OpcoesCapitulo {
  /** Índice. Ex.: '01'. */
  numero: string;
  titulo: string;
  subtitulo?: string;
  /** Evento de saída. Padrão: 'capitulo-sai'. */
  evento?: string;
}

/** Cartão de capítulo: índice grande em laranja, título e régua. */
export function* capitulo(view: View2D, opcoes: OpcoesCapitulo): ThreadGenerator {
  const tema = useTema();
  const {numero, titulo, subtitulo, evento = 'capitulo-sai'} = opcoes;
  const grupo = createRef<Node>();
  const indice = createRef<Txt>();
  const nome = createRef<Txt>();
  const sub = createRef<Txt>();
  const regua = createRef<Line>();

  view.add(
    <Node ref={grupo} x={-700}>
      <Txt
        ref={indice}
        text={numero}
        anchorX={-1}
        y={-60}
        fontFamily={fontes.display}
        fontSize={220}
        fontWeight={pesos.negrito}
        fill={tema.destaque}
        opacity={0}
      />
      <Line ref={regua} points={[[0, 70], [1100, 70]]} stroke={tema.filete} lineWidth={3} end={0} />
      <Txt
        ref={nome}
        text={titulo}
        anchorX={-1}
        y={140}
        fontFamily={fontes.display}
        fontSize={tamanhos.titulo}
        fontWeight={pesos.semi}
        fill={tema.tinta}
        opacity={0}
      />
      {subtitulo && (
        <Txt
          ref={sub}
          text={subtitulo}
          anchorX={-1}
          y={220}
          fontFamily={fontes.corpo}
          fontSize={tamanhos.corpo}
          fill={tema.suave}
          opacity={0}
        />
      )}
    </Node>,
  );

  yield* all(
    aparecer(indice(), ritmo.normal, 40),
    delay(0.15, regua().end(1, ritmo.lento, curvas.suave)),
    delay(0.3, aparecer(nome(), ritmo.normal)),
    subtitulo ? delay(0.45, aparecer(sub(), ritmo.normal)) : waitFor(0),
  );

  yield* waitUntil(evento);
  yield* all(sumir(grupo(), ritmo.normal), grupo().x(-760, ritmo.normal, curvas.saida));
  grupo().remove();
}

// ───────────────────────────── Retomada ─────────────────────────────

export interface OpcoesRetomada {
  /** Treinamento retomado. Ex.: 'BT-00'. */
  codigo: string;
  titulo: string;
  /** O que lembrar, numa frase. */
  lembrete: string;
  /** Evento de saída. Padrão: 'retomada-sai'. */
  evento?: string;
}

/**
 * "Lembra do BT-00?" — ficha de arquivo que liga este episódio a um anterior.
 * A retomada é o que costura os treinamentos; use em todo episódio.
 */
export function* retomada(view: View2D, opcoes: OpcoesRetomada): ThreadGenerator {
  const tema = useTema();
  const {codigo, titulo, lembrete, evento = 'retomada-sai'} = opcoes;
  const ficha = createRef<Rect>();
  const moldura = createRef<Moldura>();

  view.add(
    <Rect
      ref={ficha}
      layout
      direction={'column'}
      gap={18}
      padding={[40, 56]}
      width={1100}
      fill={tema.painel}
      radius={8}
      opacity={0}
    >
      <Txt
        text={`RETOMADA · ARQUIVO ${codigo}`}
        fontFamily={fontes.mono}
        fontSize={tamanhos.mini}
        letterSpacing={3}
        fill={tema.destaque}
      />
      <Txt
        text={titulo}
        fontFamily={fontes.display}
        fontSize={tamanhos.subtitulo}
        fontWeight={pesos.semi}
        fill={tema.tinta}
      />
      <Txt
        text={lembrete}
        fontFamily={fontes.corpo}
        fontSize={tamanhos.corpo}
        lineHeight={'135%'}
        fill={tema.suave}
        textWrap
        width={1100 - 112}
      />
    </Rect>,
  );
  view.add(<Moldura ref={moldura} width={() => ficha().width() + 24} height={() => ficha().height() + 24} />);

  yield* aparecer(ficha(), ritmo.normal);
  yield* moldura().desenhar(ritmo.lento);

  yield* waitUntil(evento);
  yield* all(sumir(ficha(), ritmo.normal), moldura().apagar(ritmo.normal));
  ficha().remove();
  moldura().remove();
}

// ───────────────────────────── Encerramento ─────────────────────────────

export interface OpcoesEncerramento {
  /** Treinamento concluído. Ex.: 'BT-01'. */
  codigo: string;
  /** Próximo treinamento. Ex.: 'BT-02 · Resistor'. */
  proximo?: string;
  /** Linhas do SYS//A. Padrão: conclusão + "Prossiga para o próximo módulo." */
  falas?: string[];
  /** Evento de saída. Padrão: 'encerramento-sai'. */
  evento?: string;
}

/** O sistema do laboratório declara o treinamento concluído. Com a empolgação de sempre. */
export function* encerramento(view: View2D, opcoes: OpcoesEncerramento): ThreadGenerator {
  const tema = useTema();
  const {
    codigo,
    proximo,
    falas = [`Treinamento básico ${codigo} completo.`, 'Prossiga para o próximo módulo.'],
    evento = 'encerramento-sai',
  } = opcoes;
  const sys = createRef<Anunciador>();
  const prox = createRef<Txt>();

  view.add(<Anunciador ref={sys} width={1000} opacity={0} />);
  if (proximo) {
    view.add(
      <Txt
        ref={prox}
        text={`PRÓXIMO → ${proximo}`}
        y={200}
        fontFamily={fontes.display}
        fontSize={tamanhos.rotulo}
        fontWeight={pesos.semi}
        letterSpacing={3}
        fill={tema.suave}
        opacity={0}
      />,
    );
  }

  yield* sys().aparecer();
  for (const [i, fala] of falas.entries()) {
    yield* i === 0 ? sys().dizer(fala) : sys().continuar(`\n${fala}`);
  }
  if (proximo) yield* aparecer(prox(), ritmo.normal);

  yield* waitUntil(evento);
  yield* all(sys().sumir(ritmo.normal), proximo ? sumir(prox(), ritmo.normal) : waitFor(0));
  sys().remove();
  prox()?.remove();
}
