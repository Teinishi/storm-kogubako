<script setup lang="ts">
const { t } = useI18n({ useScope: 'local' });
</script>

<template>
  <div class="space-y-4">
    <p>{{ t('message1') }}</p>
    <div class="flex gap-2 items-center flex-wrap md:flex-nowrap">
      <div>{{ t('destination') }}:</div>
      <CopyableText
        class="grow"
        text="%AppData%\Stormworks\data\vehicles"
      />
    </div>
    <p>{{ t('message2') }}</p>
    <p>{{ t('message3') }}</p>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "message1": "Extract the downloaded ZIP file and copy the extracted folder into the Stormworks vehicle directory.",
    "destination": "Destination",
    "message2": "Then, open the Stormworks workbench and load the saved Door Unit.",
    "message3": "The Door Unit is intended to be merged into an existing vehicle."
  },
  "ja": {
    "message1": "ダウンロードした ZIP ファイルを展開し、展開されたフォルダを Stormworks のビークルフォルダへコピーします。",
    "destination": "コピー先",
    "message2": "その後、Stormworks のワークベンチで保存したドアユニットを読み込んでください。",
    "message3": "ドアユニットは既存のビークルへ組み込むことを想定しています。"
  }
}
</i18n>
