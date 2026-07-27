<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <div class="space-y-6">
    <section class="space-y-3">
      <ol class="list-decimal space-y-2 pl-5 text-sm leading-6">
        <li>
          {{ t('install.step1') }}<br />
          {{ t('install.destination') }}
          <CopyableText text="%AppData%\Stormworks\data\vehicles" />
        </li>
        <li>{{ t('install.step2') }}</li>
        <li>{{ t('install.step3') }}</li>
      </ol>
    </section>

    <section class="space-y-3">
      <div
        class="border-info-300 dark:border-info-700 bg-info-50 dark:bg-info-950 text-info space-y-3 rounded-lg border p-4"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-info" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.modded') }}
          </p>
        </div>

        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-package" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.door_unit') }}
          </p>
        </div>

        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-eye-off" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.invisible') }}
          </p>
        </div>

        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-square-dashed" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.collision') }}
          </p>
        </div>

        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-workflow" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.position') }}
          </p>
        </div>

        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-check-circle" class="mt-0.5 size-5" />
          <p class="flex-1 text-sm">
            {{ t('notes.bool') }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "install": {
      "step1": "Extract the downloaded ZIP file and copy the extracted XML file and a folder into the Stormworks vehicle directory.",
      "destination": "Destination:",
      "step2": "Then, open the Stormworks workbench and load the saved Door Unit.",
      "step3": "The Door Unit is intended to be merged into an existing vehicle."
    },
    "notes": {
      "modded": "The exported Door Unit includes modded components.",
      "door_unit": "The door unit consists of a main component and a collision component. The collision component is essentially a standard door part with its visibility disabled, and it is controlled by on/off logic from the main component.",
      "invisible": "The components included in the Door Unit are invisible in the workbench.",
      "collision": "The collision is not shown by the F2 visualization. Align the Door Unit using the visible component.",
      "position": "The Position logic node (number input) and electric nodes require connections. You need to implement your own controller to output the desired door position.",
      "bool": "The Bool connections are already configured internally, so you do not need to modify or reconnect them."
    }
  },
  "ja": {
    "install": {
      "step1": "ダウンロードした ZIP ファイルを展開し、XMLファイルとフォルダを Stormworks のビークルフォルダへコピーします。",
      "destination": "コピー先:",
      "step2": "その後、Stormworks のワークベンチで保存したドアユニットを読み込んでください。",
      "step3": "ドアユニットは既存のビークルへ組み込むことを想定しています。"
    },
    "notes": {
      "modded": "このツールが出力するドアユニットには、コンポーネント Mod が組み込まれています。",
      "door_unit": "ドアユニットはメインコンポーネントと当たり判定コンポーネントで構成されています。当たり判定コンポーネントは通常のドアパーツを不可視にしたもので、メインコンポーネントからオンオフロジックで制御しています。",
      "invisible": "ドアユニットの各コンポーネントは、ワークベンチ上では不可視です。",
      "collision": "当たり判定は F2 キーでは表示されません。 位置合わせは補助ブロックを基準に行ってください。",
      "position": "Position（数値入力）のロジック配線と電気配線が必要です。ドアの位置を指定して開閉する制御は、マイクロコントローラーなどを用いて作成してください。",
      "bool": "Bool 入力はあらかじめ内部で接続されているため、配線を変更する必要はありません。"
    }
  }
}
</i18n>
