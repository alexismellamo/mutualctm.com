import { type Component, Show } from 'solid-js';

type Props = {
  message: string;
  onDismiss: () => void;
};

const Toast: Component<Props> = (props) => (
  <Show when={props.message}>
    <output
      class="fixed right-4 top-4 z-50 flex max-w-md items-start gap-3 rounded-lg border border-green-200 bg-white p-4 text-green-800 shadow-xl"
      aria-live="polite"
    >
      <svg
        class="mt-0.5 h-5 w-5 flex-none text-green-600"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clip-rule="evenodd"
        />
      </svg>
      <p class="flex-1 text-sm font-medium">{props.message}</p>
      <button
        type="button"
        onClick={props.onDismiss}
        class="-mr-1 -mt-1 rounded p-1 text-green-700 hover:bg-green-100"
        aria-label="Cerrar notificación"
      >
        <span aria-hidden="true">×</span>
      </button>
    </output>
  </Show>
);

export default Toast;
