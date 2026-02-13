import { Suspense } from 'react';
import SettingsContent from './settings-content';

function SettingsLoadingFallback() {
	return (
		<div className="flex min-h-[50vh] items-center justify-center">
			<div className="animate-pulse text-sm text-[var(--text-tertiary)]">
				Loading...
			</div>
		</div>
	);
}

export default function SettingsPage() {
	return (
		<Suspense fallback={<SettingsLoadingFallback />}>
			<SettingsContent />
		</Suspense>
	);
}
