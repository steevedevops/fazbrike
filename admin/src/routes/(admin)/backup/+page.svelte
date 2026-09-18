<script lang="ts">
	import { api } from '$lib/api';
	import { toast } from '$lib/toast';

	const CONFIRM_PHRASE = 'APAGAR E RESTAURAR';

	let downloading = $state(false);
	let restoring = $state(false);
	let file = $state<File | null>(null);
	let confirmText = $state('');

	const canRestore = $derived(!!file && confirmText === CONFIRM_PHRASE && !restoring);

	async function onDownload() {
		downloading = true;
		try {
			await api.downloadBackup();
			toast('success', 'Backup gerado e baixado.');
		} catch (e) {
			toast('error', e instanceof Error ? e.message : 'Falha ao gerar backup.');
		} finally {
			downloading = false;
		}
	}

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		file = input.files?.[0] ?? null;
	}

	async function onRestore() {
		if (!file || confirmText !== CONFIRM_PHRASE) return;
		restoring = true;
		try {
			const res = await api.restoreBackup(file, confirmText);
			toast('success', res.message ?? 'Backup restaurado com sucesso.');
			confirmText = '';
			file = null;
		} catch (e) {
			toast('error', e instanceof Error ? e.message : 'Falha ao restaurar backup.');
		} finally {
			restoring = false;
		}
	}
</script>

<header class="head">
	<div>
		<h1 class="page-title">Backup</h1>
		<p class="page-sub">Backup e restauração do banco de dados e dos arquivos enviados</p>
	</div>
</header>

<div class="card">
	<div class="card-head">
		<h2>Gerar backup</h2>
	</div>
	<div class="card-body">
		<p>
			Baixa um arquivo .zip com uma cópia completa do banco de dados (via pg_dump) e, se o
			armazenamento local estiver ativo, dos arquivos enviados (fotos de anúncios, avatares etc).
		</p>
		<button class="btn primary" type="button" onclick={onDownload} disabled={downloading}>
			{downloading ? 'Gerando…' : 'Gerar backup agora'}
		</button>
	</div>
</div>

<div class="card danger-card">
	<div class="card-head danger">
		<h2>Restaurar backup</h2>
	</div>
	<div class="card-body">
		<p class="warning">
			<strong>Atenção:</strong> restaurar um backup <strong>apaga todos os dados atuais do banco</strong>
			e os substitui pelo conteúdo do arquivo enviado. Os arquivos enviados (uploads) também são
			completamente substituídos, se o backup contiver essa pasta. Essa ação não pode ser desfeita.
			Use apenas contra um banco que você já decidiu descartar (ex.: preparar produção a partir de
			um backup, ou reverter um ambiente de testes).
		</p>
		<label class="field">
			<span>Arquivo de backup (.zip)</span>
			<input type="file" accept=".zip" onchange={onFileChange} disabled={restoring} />
		</label>
		<label class="field">
			<span>
				Para confirmar, digite exatamente: <code>{CONFIRM_PHRASE}</code>
			</span>
			<input type="text" bind:value={confirmText} disabled={restoring} placeholder={CONFIRM_PHRASE} />
		</label>
		<button class="btn danger" type="button" onclick={onRestore} disabled={!canRestore}>
			{restoring ? 'Restaurando…' : 'Apagar dados atuais e restaurar'}
		</button>
	</div>
</div>

<style>
	.head {
		margin-bottom: 24px;
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-xs);
		margin-bottom: 20px;
		overflow: hidden;
	}
	.card-head {
		padding: 14px 16px;
		border-bottom: 1px solid var(--border);
		background: var(--subtle);
	}
	.card-head.danger {
		background: var(--danger-soft);
	}
	.card-head h2 {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
		margin: 0;
	}
	.card-body {
		padding: 18px 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.card-body p {
		font-size: 13px;
		color: var(--muted);
		line-height: 1.55;
		margin: 0;
	}
	.warning strong {
		color: var(--danger);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 12.5px;
		font-weight: 550;
		color: var(--ink);
	}
	.field input[type='text'],
	.field input[type='file'] {
		font-size: 13px;
		padding: 8px 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--canvas);
		color: var(--ink);
	}
	.field code {
		background: var(--subtle);
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 12px;
	}
	.btn {
		align-self: flex-start;
		border: none;
		border-radius: var(--radius-sm);
		padding: 9px 16px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.btn.primary {
		background: var(--ink);
		color: #fff;
	}
	.btn.danger {
		background: var(--danger);
		color: #fff;
	}
</style>
