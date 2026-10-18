import { Form } from 'react-bootstrap';
import SpkLovInput from '@/@spk-reusable-components/reusable-uielements/spk-lovinput';

/**
 * SpkLovToggleInput — skill-defined Spk component, NOT part of the onegenesis-web kit.
 *
 * Packages the "Registered X?" field used by Inquiry of Material, New Material Registration and
 * Material Monitoring (Producer / Origin / Vendor): switch ON = value must come from the LOV
 * (SpkLovInput, text input locked), switch OFF = free-text input. Switch sits below the input.
 *
 * Copy into src/@spk-reusable-components/reusable-uielements/ of a sibling app. Inside
 * onegenesis-web itself write the expanded markup instead (see InquiryMaterialDetailsSection.jsx).
 * Mirrors spk-lovinput.jsx as of 2026-10; re-check if SpkLovInput's props change.
 *
 * Props
 *   label, required        label text + red * marker (label omitted when no label)
 *   className              wrapper class, e.g. 'col-xl-3' (no wrapper div when omitted)
 *   isRegistered           switch state
 *   onRegisteredChange     (checked) => void — caller resets value (and its id) here
 *   switchId, switchLabel  unique id + text, e.g. 'registered-producer-switch', 'Registered Producer?'
 *   value                  text shown in both modes
 *   onChange               (string) => void — free-text mode only (uppercase etc. done by caller)
 *   placeholder, maxLength free-text input attributes
 *   objectId, lovId, lovWhere, title   LOV config (registered mode)
 *   onSelect               (row, { idColumn, descColumn }) => void — registered mode
 *   idValue                optional picked id, shown below as small text-info
 *   disabled               locks input, LOV button and switch (read-only form / saving)
 */
const SpkLovToggleInput = ({
  label,
  required = false,
  className,
  isRegistered,
  onRegisteredChange,
  switchId,
  switchLabel,
  value = '',
  onChange,
  placeholder = '',
  maxLength,
  objectId,
  lovId,
  lovWhere,
  title,
  onSelect,
  idValue,
  disabled = false,
}) => {
  const field = (
    <>
      {label && (
        <label className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {isRegistered ? (
        <SpkLovInput
          value={value}
          inputDisabled
          objectId={objectId}
          lovId={lovId}
          lovWhere={lovWhere}
          title={title}
          onSelect={onSelect}
          lovButtonVariant="primary"
          lovButtonIcon="ri-search-line"
          disabled={disabled}
        />
      ) : (
        <input
          type="text"
          className="form-control"
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
      {idValue && <div className="small text-info mt-1">{idValue}</div>}
      <Form.Check
        type="switch"
        id={switchId}
        label={switchLabel}
        checked={Boolean(isRegistered)}
        disabled={disabled}
        onChange={(e) => onRegisteredChange?.(e.target.checked)}
        className="form-label"
      />
    </>
  );

  return className ? <div className={className}>{field}</div> : field;
};

export default SpkLovToggleInput;
