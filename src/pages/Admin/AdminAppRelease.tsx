import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Smartphone, Save } from 'lucide-react';
import { Card, CardBody } from '../../components/Card';
import { FormField, Input, Select } from '../../components/Form';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import { useConfirm } from '../../components/ConfirmModal';
import {
  getAppRelease, updateAppRelease, type AppReleasePolicy,
} from '../../services/apiServices/adminService';
import {
  appReleaseSchema, compareVersions, type AppReleaseFormValues,
} from '../../utils/adminValidation';

const BLANK: AppReleaseFormValues = {
  platform: 'android',
  latestVersion: '',
  minSupportedVersion: '',
  storeUrl: '',
  updateMessage: '',
  blockingMessage: '',
  enabled: true,
};

/**
 * What the mobile app is told about updates.
 *
 * The first form in the admin console — everything else here reads or deletes —
 * so it sets the pattern: react-hook-form + zodResolver, `noValidate`, errors
 * under the field, no `toast.error('X is required')`.
 */
export default function AdminAppRelease() {
  const [loading, setLoading] = useState(true);
  const [inForce, setInForce] = useState<AppReleasePolicy | null>(null);
  const { confirm, ConfirmModal } = useConfirm();

  const {
    register, handleSubmit, reset, control,
    formState: { errors, isSubmitting },
  } = useForm<AppReleaseFormValues>({
    resolver: zodResolver(appReleaseSchema),
    defaultValues: BLANK,
  });

  const watchedMin = useWatch({ control, name: 'minSupportedVersion' });
  const watchedEnabled = useWatch({ control, name: 'enabled' });

  useEffect(() => {
    getAppRelease('android')
      .then(({ data }) => {
        setInForce(data);
        if (data) {
          reset({
            platform: data.platform,
            latestVersion: data.latestVersion,
            minSupportedVersion: data.minSupportedVersion,
            storeUrl: data.storeUrl,
            updateMessage: data.updateMessage,
            blockingMessage: data.blockingMessage,
            enabled: data.enabled,
          });
        }
      })
      .catch(() => toast.error('Could not load the release policy'))
      .finally(() => setLoading(false));
  }, [reset]);

  const onValid = async (values: AppReleaseFormValues) => {
    /**
     * Confirm only when the floor goes UP, including blank to set — that is the
     * change that starts blocking people. A confirm on every save is a confirm
     * nobody reads.
     */
    const raisesFloor =
      values.minSupportedVersion !== '' &&
      (inForce?.minSupportedVersion
        ? compareVersions(values.minSupportedVersion, inForce.minSupportedVersion) === 1
        : true);

    if (raisesFloor) {
      const ok = await confirm({
        title: 'Block older app versions?',
        message: `Anyone on a version below ${values.minSupportedVersion} will be unable to use the app until they update. Make sure that version is actually live on the Play Store first.`,
        confirmLabel: 'Yes, block them',
        intent: 'danger',
      });
      if (!ok) return;
    }

    try {
      const { data } = await updateAppRelease(values as AppReleasePolicy);
      setInForce(data);
      toast.success('Release policy saved');
    } catch (e) {
      // The server is the enforcement point and rejects the same states this
      // form does; surface its message rather than guessing.
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || 'Could not save the release policy');
    }
  };

  if (loading) return <Loader />;

  /** The sentence that turns an abstract field into real people. */
  const consequence = !watchedEnabled
    ? 'The policy is disabled — nobody is prompted and nobody is blocked.'
    : watchedMin
      ? `Users below ${watchedMin} will be blocked from using the app.`
      : 'Nobody will be blocked.';

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-gray-900 flex items-center gap-3">
          <Smartphone className="w-7 h-7 text-primary-600" strokeWidth={1.5} />
          App Release
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          What the Android app is told about updates. Takes effect on each device's next launch or resume.
        </p>
      </div>

      {/* What the field is being told right now, before any editing. */}
      <Card title="Currently in force">
        <CardBody>
          {inForce ? (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Latest version</dt>
                <dd className="font-bold text-gray-900">{inForce.latestVersion || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Blocking below</dt>
                <dd className="font-bold text-gray-900">{inForce.minSupportedVersion || 'nobody'}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</dt>
                <dd className="font-bold text-gray-900">{inForce.enabled ? 'Enabled' : 'Disabled'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-600">
              No policy yet. Nothing is being prompted or blocked.
            </p>
          )}
        </CardBody>
      </Card>

      <Card title="Update policy">
        <CardBody>
          <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Latest version on the store" error={errors.latestVersion?.message}>
                <Input
                  id="latestVersion"
                  {...register('latestVersion')}
                  placeholder="1.1.0"
                  error={!!errors.latestVersion}
                  aria-invalid={!!errors.latestVersion}
                />
              </FormField>

              <FormField label="Minimum supported version" error={errors.minSupportedVersion?.message}>
                <Input
                  id="minSupportedVersion"
                  {...register('minSupportedVersion')}
                  placeholder="Leave blank to block nobody"
                  error={!!errors.minSupportedVersion}
                  aria-invalid={!!errors.minSupportedVersion}
                />
              </FormField>
            </div>

            <p className={`text-sm font-semibold ${watchedEnabled && watchedMin ? 'text-danger' : 'text-gray-600'}`}>
              {consequence}
            </p>

            <FormField label="Store URL (used by iOS only)" error={errors.storeUrl?.message}>
              <Input
                id="storeUrl"
                {...register('storeUrl')}
                placeholder="https://play.google.com/store/apps/details?id=..."
                error={!!errors.storeUrl}
                aria-invalid={!!errors.storeUrl}
              />
            </FormField>

            <FormField label="Update message (optional prompt)" error={errors.updateMessage?.message}>
              <Input
                id="updateMessage"
                {...register('updateMessage')}
                placeholder="A new version of GaragePulse is available."
                error={!!errors.updateMessage}
              />
            </FormField>

            <FormField label="Blocking message (mandatory prompt)" error={errors.blockingMessage?.message}>
              <Input
                id="blockingMessage"
                {...register('blockingMessage')}
                placeholder="This version is no longer supported. Please update to carry on."
                error={!!errors.blockingMessage}
              />
            </FormField>

            {/* A Select rather than a checkbox: components/Form.tsx has no
                Checkbox, and inventing one is a design-system change that
                belongs in its own change. */}
            <FormField label="Policy status" error={errors.enabled?.message}>
              <Select
                id="enabled"
                {...register('enabled', { setValueAs: v => v === 'true' || v === true })}
                error={!!errors.enabled}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled — prompt and block nobody</option>
              </Select>
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" variant="accent" icon={Save} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save policy'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <ConfirmModal />
    </div>
  );
}
