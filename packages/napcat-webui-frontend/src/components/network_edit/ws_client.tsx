import { Button } from '@heroui/button';
import { Input, Textarea } from '@heroui/input';
import { ModalBody, ModalFooter } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import SwitchCard from '../switch_card';
import { random_token } from './generic_form';

export interface WebsocketClientFormProps {
  data?: OneBotConfig['network']['websocketClients'][0]
  onClose: () => void
  onSubmit: (
    data: OneBotConfig['network']['websocketClients'][0]
  ) => Promise<void>
}

type WebsocketClientFormType = OneBotConfig['network']['websocketClients'][0];
type WebsocketClientEditorValue = Omit<WebsocketClientFormType, 'eventFilter'> & {
  eventFilter: NonNullable<WebsocketClientFormType['eventFilter']>;
};

function parseGroupIds (value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function formatGroupIds (value: string[] | undefined): string {
  return (value || []).join('\n');
}

const inputClassNames = {
  inputWrapper:
    'bg-default-100/50 dark:bg-white/5 backdrop-blur-md border border-transparent hover:bg-default-200/50 dark:hover:bg-white/10 transition-all shadow-sm data-[hover=true]:border-default-300',
  input: 'bg-transparent text-default-700 placeholder:text-default-400',
};

const WebsocketClientForm: React.FC<WebsocketClientFormProps> = ({
  data,
  onClose,
  onSubmit,
}) => {
  const defaultValues = useMemo<WebsocketClientEditorValue>(() => ({
    enable: false,
    name: '',
    url: 'ws://localhost:8082',
    reportSelfMessage: false,
    messagePostFormat: 'array',
    token: random_token(16),
    debug: false,
    heartInterval: 30000,
    reconnectInterval: 30000,
    eventFilter: {
      groupWhitelist: [],
      groupBlacklist: [],
    },
  }), []);

  const [formData, setFormData] = useState<WebsocketClientEditorValue>(defaultValues);
  const [groupWhitelistText, setGroupWhitelistText] = useState('');
  const [groupBlacklistText, setGroupBlacklistText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextValue = data
      ? ({
        ...defaultValues,
        ...data,
        eventFilter: {
          ...defaultValues.eventFilter,
          ...(data.eventFilter || {}),
        },
      } satisfies WebsocketClientEditorValue)
      : defaultValues;

    setFormData(nextValue);
    setGroupWhitelistText(formatGroupIds(nextValue.eventFilter.groupWhitelist));
    setGroupBlacklistText(formatGroupIds(nextValue.eventFilter.groupBlacklist));
  }, [data, defaultValues]);

  const updateField = <K extends keyof WebsocketClientEditorValue> (
    key: K,
    value: WebsocketClientEditorValue[K]
  ) => {
    setFormData(current => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请填写名称');
      return;
    }

    if (!formData.url.trim()) {
      toast.error('请填写URL');
      return;
    }

    const nextData: WebsocketClientFormType = {
      ...formData,
      heartInterval: Number(formData.heartInterval),
      reconnectInterval: Number(formData.reconnectInterval),
      eventFilter: {
        groupWhitelist: parseGroupIds(groupWhitelistText),
        groupBlacklist: parseGroupIds(groupBlacklistText),
      },
    };

    if (Number.isNaN(nextData.heartInterval) || nextData.heartInterval <= 0) {
      toast.error('心跳间隔必须是大于 0 的数字');
      return;
    }

    if (Number.isNaN(nextData.reconnectInterval) || nextData.reconnectInterval <= 0) {
      toast.error('重连间隔必须是大于 0 的数字');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(nextData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ModalBody>
        <div className='grid grid-cols-2 gap-y-4 gap-x-2 w-full'>
          <div className='col-span-1'>
            <SwitchCard
              value={formData.enable}
              label='启用'
              description='保存后启用此配置'
              onValueChange={(value) => updateField('enable', value)}
            />
          </div>
          <div className='col-span-1'>
            <SwitchCard
              value={formData.debug}
              label='开启Debug'
              description='是否开启调试模式'
              onValueChange={(value) => updateField('debug', value)}
            />
          </div>
          <div className='col-span-2'>
            <Input
              value={formData.name}
              onValueChange={(value) => updateField('name', value)}
              isRequired
              isDisabled={!!data}
              label='名称'
              placeholder='请输入名称'
              classNames={inputClassNames}
            />
          </div>
          <div className='col-span-2'>
            <Input
              value={formData.url}
              onValueChange={(value) => updateField('url', value)}
              isRequired
              label='URL'
              placeholder='请输入URL'
              classNames={inputClassNames}
            />
          </div>
          <div className='col-span-1'>
            <SwitchCard
              value={formData.reportSelfMessage}
              label='上报自身消息'
              description='是否上报自身消息'
              onValueChange={(value) => updateField('reportSelfMessage', value)}
            />
          </div>
          <div className='col-span-1'>
            <Select
              label='消息格式'
              placeholder='请选择消息格式'
              selectedKeys={[formData.messagePostFormat]}
              classNames={{
                trigger: 'bg-default-100/50 dark:bg-white/5 backdrop-blur-md border border-transparent hover:bg-default-200/50 dark:hover:bg-white/10 transition-all shadow-sm data-[hover=true]:border-default-300',
                value: 'text-default-700',
              }}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                if (value === 'array' || value === 'string') {
                  updateField('messagePostFormat', value);
                }
              }}
            >
              <SelectItem key='array' value='Array'>
                Array
              </SelectItem>
              <SelectItem key='string' value='String'>
                String
              </SelectItem>
            </Select>
          </div>
          <div className='col-span-2'>
            <Input
              value={formData.token}
              onValueChange={(value) => updateField('token', value)}
              label='Token'
              placeholder='请输入Token'
              classNames={inputClassNames}
            />
          </div>
          <div className='col-span-1'>
            <Input
              value={String(formData.heartInterval)}
              onValueChange={(value) => updateField('heartInterval', Number(value))}
              isRequired
              label='心跳间隔'
              placeholder='请输入心跳间隔'
              classNames={inputClassNames}
            />
          </div>
          <div className='col-span-1'>
            <Input
              value={String(formData.reconnectInterval)}
              onValueChange={(value) => updateField('reconnectInterval', Number(value))}
              isRequired
              label='重连间隔'
              placeholder='请输入重连间隔'
              classNames={inputClassNames}
            />
          </div>
          <div className='col-span-2'>
            <Textarea
              label='Group whitelist'
              placeholder={'One group ID per line\n123456789\n987654321'}
              description='Only group messages from these group IDs will be forwarded when the list is not empty.'
              value={groupWhitelistText}
              onValueChange={setGroupWhitelistText}
              minRows={4}
              classNames={{
                inputWrapper: inputClassNames.inputWrapper,
                input: 'bg-transparent text-default-700 placeholder:text-default-400 font-mono text-sm',
              }}
            />
          </div>
          <div className='col-span-2'>
            <Textarea
              label='Group blacklist'
              placeholder={'One group ID per line\n123456789'}
              description='Group IDs in this list are always dropped, even if they also exist in the whitelist.'
              value={groupBlacklistText}
              onValueChange={setGroupBlacklistText}
              minRows={4}
              classNames={{
                inputWrapper: inputClassNames.inputWrapper,
                input: 'bg-transparent text-default-700 placeholder:text-default-400 font-mono text-sm',
              }}
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          color='primary'
          isDisabled={isSubmitting}
          variant='light'
          onPress={onClose}
        >
          关闭
        </Button>
        <Button
          color='primary'
          isLoading={isSubmitting}
          onPress={handleSubmit}
        >
          保存
        </Button>
      </ModalFooter>
    </>
  );
};

export default WebsocketClientForm;
