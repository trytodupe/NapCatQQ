<template>
    <div>
        <t-form labelAlign="left">
            <t-form-item label="启用">
                <t-switch v-model="config.enable" />
            </t-form-item>
            <t-form-item label="URL">
                <t-input v-model="config.url" />
            </t-form-item>
            <t-form-item label="消息格式">
                <t-select v-model="config.messagePostFormat" :options="messageFormatOptions" />
            </t-form-item>
            <t-form-item label="报告自身消息">
                <t-switch v-model="config.reportSelfMessage" />
            </t-form-item>
            <t-form-item label="Token">
                <t-input v-model="config.token" />
            </t-form-item>
            <t-form-item label="调试模式">
                <t-switch v-model="config.debug" />
            </t-form-item>
            <t-form-item label="心跳间隔">
                <t-input v-model.number="config.heartInterval" type="number" />
            </t-form-item>
            <t-form-item label="群白名单">
                <t-textarea
                    v-model="groupWhitelistText"
                    placeholder="One group ID per line or separated by commas"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                />
            </t-form-item>
            <t-form-item label="群黑名单">
                <t-textarea
                    v-model="groupBlacklistText"
                    placeholder="One group ID per line or separated by commas"
                    :autosize="{ minRows: 3, maxRows: 6 }"
                />
            </t-form-item>
        </t-form>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { WebsocketClientConfig } from '../../../../src/onebot/config/config';

const props = defineProps<{
    config: WebsocketClientConfig;
}>();

const messageFormatOptions = ref([
    { label: 'Array', value: 'array' },
    { label: 'String', value: 'string' },
]);

const groupWhitelistText = ref('');
const groupBlacklistText = ref('');

function ensureEventFilter() {
    props.config.eventFilter = {
        groupWhitelist: props.config.eventFilter?.groupWhitelist || [],
        groupBlacklist: props.config.eventFilter?.groupBlacklist || [],
    };
}

function parseGroupIds(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(/\r?\n|,/)
                .map(item => item.trim())
                .filter(Boolean)
        )
    );
}

function formatGroupIds(value: string[] | undefined): string {
    return (value || []).join('\n');
}

watch(
    () => props.config.messagePostFormat,
    (newValue) => {
        if (newValue !== 'array' && newValue !== 'string') {
            props.config.messagePostFormat = 'array';
        }
    },
    { immediate: true }
);

watch(
    () => [props.config.eventFilter?.groupWhitelist, props.config.eventFilter?.groupBlacklist],
    () => {
        ensureEventFilter();
        const nextWhitelistText = formatGroupIds(props.config.eventFilter.groupWhitelist);
        const nextBlacklistText = formatGroupIds(props.config.eventFilter.groupBlacklist);
        if (groupWhitelistText.value !== nextWhitelistText) {
            groupWhitelistText.value = nextWhitelistText;
        }
        if (groupBlacklistText.value !== nextBlacklistText) {
            groupBlacklistText.value = nextBlacklistText;
        }
    },
    { immediate: true }
);

watch(groupWhitelistText, (value) => {
    ensureEventFilter();
    props.config.eventFilter = {
        groupWhitelist: parseGroupIds(value),
        groupBlacklist: props.config.eventFilter?.groupBlacklist || [],
    };
});

watch(groupBlacklistText, (value) => {
    ensureEventFilter();
    props.config.eventFilter = {
        groupWhitelist: props.config.eventFilter?.groupWhitelist || [],
        groupBlacklist: parseGroupIds(value),
    };
});
</script>

<style scoped></style>
