/** @format */

"use client";

import { rootCauseNodeTypeSchema } from "@/features/incidents/schema";
import {
  type IncidentFormValues,
} from "@/features/incidents/form-schema";
import {
  Controller,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { FormSectionHeading } from "./form-fields";

type RootCauseNode = IncidentFormValues["rootCauseTree"][number];

const nodeTypeLabels: Record<RootCauseNode["type"], string> = {
  ROOT_CAUSE: "Root cause",
  CONTRIBUTING_FACTOR: "Contributing factor",
  DIRECT_FAILURE: "Direct failure",
  SYSTEM_IMPACT: "System impact",
};

const inputClass = (hasError: boolean) =>
  `block w-full rounded-md border bg-[#0d1520] px-4 py-3 text-[14px] leading-5 text-slate-100 placeholder:text-slate-600 transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-2 motion-reduce:transition-none ${
    hasError
      ? "border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-slate-800 hover:border-slate-700 focus:border-[#c6e47c] focus:ring-[#c6e47c]/25 focus:bg-[#0e1622]"
  }`;

const labelClass =
  "block font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400";

const fieldErrorClass =
  "mt-1 font-mono text-[11px] leading-[1.5] tracking-[0.02em] text-rose-400";

function getDescendantIds(nodeId: string, nodes: RootCauseNode[]) {
  const descendants = new Set([nodeId]);
  let foundDescendant = true;

  while (foundDescendant) {
    foundDescendant = false;
    for (const node of nodes) {
      if (
        node.parentId !== null &&
        descendants.has(node.parentId) &&
        !descendants.has(node.id)
      ) {
        descendants.add(node.id);
        foundDescendant = true;
      }
    }
  }

  return descendants;
}

function getNodeDepth(node: RootCauseNode, nodes: RootCauseNode[]) {
  let depth = 0;
  let parentId = node.parentId;

  while (parentId !== null && depth < nodes.length) {
    const parent = nodes.find((item) => item.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }

  return depth;
}

export default function RootCauseArchitectureStep() {
  const {
    control,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rootCauseTree",
  });
  const nodes = watch("rootCauseTree") ?? [];
  const rootCauseTreeError =
    errors.rootCauseTree?.message ?? errors.rootCauseTree?.root?.message;

  const addNode = (parentId: string | null) => {
    append({
      id: crypto.randomUUID(),
      parentId,
      type: parentId === null ? "ROOT_CAUSE" : "CONTRIBUTING_FACTOR",
      title: "",
      description: "",
      systemComponent: "",
    });
  };

  const addNodeToRoot = () => {
    const root = nodes.find((node) => node.parentId === null);
    if (root) addNode(root.id);
  };

  const removeNode = (index: number) => {
    const node = nodes[index];
    if (!node) return;

    const childIndexes = nodes.reduce<number[]>((indexes, candidate, i) => {
      if (candidate.parentId === node.id) indexes.push(i);
      return indexes;
    }, []);

    if (node.parentId === null && childIndexes.length > 0) return;

    for (const childIndex of childIndexes) {
      setValue(`rootCauseTree.${childIndex}.parentId`, node.parentId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    remove(index);
  };

  const ghostClass =
    "w-full rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[12px] uppercase leading-[1.4] tracking-[0.08em] text-slate-500";

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <FormSectionHeading
          title="Root cause analysis"
          description="Build a tree from the root cause through contributing factors, failures, and system impact."
        />
        <button
          type="button"
          onClick={() =>
            nodes.length === 0 ? addNode(null) : addNodeToRoot()
          }
          className="shrink-0 border border-slate-700 bg-slate-900/40 px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-slate-200 transition-colors hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d16]"
        >
          + {nodes.length === 0 ? "Add root cause" : "Add node"}
        </button>
      </div>

      {rootCauseTreeError ? (
        <p role="alert" className={fieldErrorClass}>
          {rootCauseTreeError}
        </p>
      ) : null}

      {nodes.length === 0 ? (
        <div className="border border-dashed border-slate-700/80 px-5 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
            No nodes yet
          </p>
          <p className="mt-1 text-[12px] text-slate-400">
            Start the analysis by adding its root cause.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {fields.map((field, index) => {
            const node = nodes[index];
            if (!node) return null;

            const nodeErrors = errors.rootCauseTree?.[index];
            const descendantIds = getDescendantIds(node.id, nodes);
            const children = nodes.filter(
              (candidate) => candidate.parentId === node.id,
            );
            const isRoot = node.parentId === null;
            const canRemove = !isRoot || children.length === 0;
            const depth = Math.min(getNodeDepth(node, nodes), 4);

            return (
              <li key={field.id} style={{ marginLeft: `${depth * 16}px` }}>
                <fieldset className="border border-slate-800/80 bg-[#0c151c] px-4 py-5 sm:px-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <legend className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
                      {node.title.trim() || `Node ${index + 1}`}
                      <span className="border border-slate-700/80 bg-slate-900/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-slate-400">
                        {nodeTypeLabels[node.type]}
                      </span>
                    </legend>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => addNode(node.id)}
                        className="font-mono text-[10px] uppercase tracking-[0.06em] text-[#c6e47c] transition-colors hover:text-[#dcf7a0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c6e47c]"
                      >
                        + Add child
                      </button>
                      <button
                        type="button"
                        onClick={() => removeNode(index)}
                        disabled={!canRemove}
                        title={
                          canRemove
                            ? undefined
                            : "Move or remove this node's children first"
                        }
                        aria-label={`Remove ${node.title.trim() || `node ${index + 1}`}`}
                        className="font-mono text-[10px] uppercase tracking-[0.06em] text-slate-500 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`root-cause-${index}-type`}
                        className={labelClass}
                      >
                        Node type
                      </label>
                      <select
                        id={`root-cause-${index}-type`}
                        {...register(
                          `rootCauseTree.${index}.type` as const,
                        )}
                        className={inputClass(Boolean(nodeErrors?.type))}
                      >
                        {rootCauseNodeTypeSchema.options.map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="bg-[#0b121a] text-slate-100"
                          >
                            {nodeTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                      {nodeErrors?.type ? (
                        <p className={fieldErrorClass}>
                          {nodeErrors.type.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor={`root-cause-${index}-parent`}
                        className={labelClass}
                      >
                        Parent node
                      </label>
                      {isRoot ? (
                        <p
                          id={`root-cause-${index}-parent`}
                          className={ghostClass}
                        >
                          No parent (root)
                        </p>
                      ) : (
                        <select
                          id={`root-cause-${index}-parent`}
                          value={node.parentId ?? ""}
                          onChange={(event) =>
                            setValue(
                              `rootCauseTree.${index}.parentId`,
                              event.target.value,
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }
                          className={inputClass(
                            Boolean(nodeErrors?.parentId),
                          )}
                        >
                          {nodes
                            .filter(
                              (candidate) =>
                                !descendantIds.has(candidate.id),
                            )
                            .map((candidate) => (
                              <option
                                key={candidate.id}
                                value={candidate.id}
                                className="bg-[#0b121a] text-slate-100"
                              >
                                {candidate.title.trim() ||
                                  `Node ${nodes.indexOf(candidate) + 1}`}
                              </option>
                            ))}
                        </select>
                      )}
                      {nodeErrors?.parentId ? (
                        <p className={fieldErrorClass}>
                          {nodeErrors.parentId.message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`root-cause-${index}-title`}
                      className={labelClass}
                    >
                      Title
                    </label>
                    <input
                      id={`root-cause-${index}-title`}
                      type="text"
                      {...register(
                        `rootCauseTree.${index}.title` as const,
                      )}
                      placeholder="e.g. Database connection pool exhausted"
                      className={inputClass(Boolean(nodeErrors?.title))}
                    />
                    {nodeErrors?.title ? (
                      <p className={fieldErrorClass}>
                        {nodeErrors.title.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`root-cause-${index}-description`}
                      className={labelClass}
                    >
                      Description
                    </label>
                    <textarea
                      id={`root-cause-${index}-description`}
                      rows={3}
                      {...register(
                        `rootCauseTree.${index}.description` as const,
                      )}
                      placeholder="Explain how this factor contributed to the incident."
                      className={`${inputClass(
                        Boolean(nodeErrors?.description),
                      )} h-auto py-2.5 leading-5`}
                    />
                    {nodeErrors?.description ? (
                      <p className={fieldErrorClass}>
                        {nodeErrors.description.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor={`root-cause-${index}-component`}
                      className={labelClass}
                    >
                      System component
                    </label>
                    <input
                      id={`root-cause-${index}-component`}
                      type="text"
                      {...register(
                        `rootCauseTree.${index}.systemComponent` as const,
                      )}
                      placeholder="e.g. Payment API"
                      className={inputClass(
                        Boolean(nodeErrors?.systemComponent),
                      )}
                    />
                    {nodeErrors?.systemComponent ? (
                      <p className={fieldErrorClass}>
                        {nodeErrors.systemComponent.message}
                      </p>
                    ) : null}
                  </div>
                </fieldset>
              </li>
            );
          })}
        </ol>
      )}

      <section className="space-y-5 border-t border-slate-800/80 pt-6">
        <FormSectionHeading
          title="Architecture before / after"
          description="Describe how the system architecture changed to address the incident, and clarify whether the change is documented fact or a reconstruction."
        />

        <div>
          <label
            htmlFor="architecture-before-fix"
            className={labelClass}
          >
            Before the fix
          </label>
          <textarea
            id="architecture-before-fix"
            rows={4}
            {...register("architectureDiff.beforeFix")}
            placeholder="Describe the relevant architecture and how it behaved before the fix."
            className={`${inputClass(
              Boolean(errors.architectureDiff?.beforeFix),
            )} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.beforeFix ? (
            <p className={fieldErrorClass}>
              {errors.architectureDiff.beforeFix.message}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="architecture-after-fix" className={labelClass}>
            After the fix
          </label>
          <textarea
            id="architecture-after-fix"
            rows={4}
            {...register("architectureDiff.afterFix")}
            placeholder="Describe the changes made and how the system behaves now."
            className={`${inputClass(
              Boolean(errors.architectureDiff?.afterFix),
            )} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.afterFix ? (
            <p className={fieldErrorClass}>
              {errors.architectureDiff.afterFix.message}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-3">
          <legend className={labelClass}>
            Is this change documented as fact?
          </legend>
          <Controller
            control={control}
            name="architectureDiff.isFact"
            render={({ field }) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex cursor-pointer items-center gap-2 border border-slate-800 bg-[#0b121a] px-3.5 py-2.5 text-[13px] text-slate-200 transition has-[:checked]:border-[#c6e47c]/60 has-[:checked]:bg-[#c6e47c]/[0.08]">
                  <input
                    ref={field.ref}
                    type="radio"
                    name={field.name}
                    value="true"
                    checked={field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(true)}
                    className="accent-[#c6e47c]"
                  />
                  Yes, this is documented
                </label>
                <label className="flex cursor-pointer items-center gap-2 border border-slate-800 bg-[#0b121a] px-3.5 py-2.5 text-[13px] text-slate-200 transition has-[:checked]:border-[#c6e47c]/60 has-[:checked]:bg-[#c6e47c]/[0.08]">
                  <input
                    type="radio"
                    name={field.name}
                    value="false"
                    checked={!field.value}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(false)}
                    className="accent-[#c6e47c]"
                  />
                  No, this is reconstructed
                </label>
              </div>
            )}
          />
        </fieldset>

        {!watch("architectureDiff.isFact") ? (
          <div>
            <label htmlFor="architecture-notes" className={labelClass}>
              Reconstruction notes
            </label>
            <textarea
              id="architecture-notes"
              rows={3}
              {...register("architectureDiff.notes")}
              placeholder="Explain what evidence or reasoning supports this reconstruction."
              className={`${inputClass(
                Boolean(errors.architectureDiff?.notes),
              )} h-auto py-2.5 leading-5`}
            />
            {errors.architectureDiff?.notes ? (
              <p className={fieldErrorClass}>
                {errors.architectureDiff.notes.message}
              </p>
            ) : null}
            <p className="mt-1 font-mono text-[10px] leading-[1.5] tracking-[0.04em] text-slate-500">
              Notes are required when the architecture details are
              reconstructed.
            </p>
          </div>
        ) : null}
      </section>
    </section>
  );
}
