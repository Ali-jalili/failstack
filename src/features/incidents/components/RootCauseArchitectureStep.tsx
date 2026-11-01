/** @format */

"use client";

import { useState } from "react";
import { rootCauseNodeTypeSchema } from "@/features/incidents/schema";
import { type IncidentFormValues } from "@/features/incidents/form-schema";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
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

function hasNodeErrors(
  error: object | undefined,
): boolean {
  return Boolean(error && Object.keys(error).length > 0);
}

export default function RootCauseArchitectureStep() {
  const {
    control,
    setValue,
    register,
    clearErrors,
    watch,
    formState: { errors },
  } = useFormContext<IncidentFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rootCauseTree",
  });
  const nodes = watch("rootCauseTree") ?? [];
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedIndex = nodes.findIndex((node) => node.id === selectedNodeId);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const activeNode = nodes[activeIndex];
  const rootCauseTreeError =
    errors.rootCauseTree?.message ?? errors.rootCauseTree?.root?.message;
  const firstInvalidIndex = nodes.findIndex((_, index) =>
    hasNodeErrors(errors.rootCauseTree?.[index]),
  );

  const addNode = (parentId: string | null) => {
    clearErrors("rootCauseTree");
    const id = crypto.randomUUID();
    append({
      id,
      parentId,
      type: parentId === null ? "ROOT_CAUSE" : "CONTRIBUTING_FACTOR",
      title: "",
      description: "",
      systemComponent: "",
    });
    setSelectedNodeId(id);
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
    if (childIndexes.length > 0) {
      const newParent = nodes.find((candidate) => candidate.id === node.parentId);
      const destination = newParent?.title.trim() || "the root";
      const childLabel = childIndexes.length === 1 ? "child" : "children";
      if (
        !window.confirm(
          `Removing this node will move its ${childLabel} to ${destination}. Continue?`,
        )
      ) {
        return;
      }
    }

    const fallback =
      (node.parentId === null
        ? undefined
        : nodes.find((candidate) => candidate.id === node.parentId)) ??
      nodes[index + 1] ??
      nodes[index - 1];
    for (const childIndex of childIndexes) {
      setValue(`rootCauseTree.${childIndex}.parentId`, node.parentId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    remove(index);
    if (node.id === selectedNodeId) {
      setSelectedNodeId(fallback?.id ?? null);
    }
  };

  const ghostClass =
    "w-full rounded-md border border-slate-800 bg-[#0d1520] px-4 py-3 font-mono text-[12px] uppercase leading-[1.4] tracking-[0.08em] text-slate-500";

  return (
    <section className="space-y-6">
      <FormSectionHeading
        title="Root cause analysis"
        description="Build a tree from the root cause through contributing factors, failures, and system impact."
      />

      {rootCauseTreeError ? (
        <p role="alert" className={fieldErrorClass}>
          {rootCauseTreeError}
        </p>
      ) : null}
      {firstInvalidIndex >= 0 ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 border border-rose-500/30 bg-rose-500/[0.06] px-3 py-2"
        >
          <p className={fieldErrorClass}>
            Node {firstInvalidIndex + 1} has fields that need attention.
          </p>
          <button
            type="button"
            onClick={() => setSelectedNodeId(nodes[firstInvalidIndex].id)}
            className="font-mono text-[10px] uppercase tracking-[0.06em] text-rose-300 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Go to node {firstInvalidIndex + 1}
          </button>
        </div>
      ) : null}

      {nodes.length === 0 ? (
        <div className="border border-dashed border-slate-700/80 px-5 py-8 text-center">
          <p className="text-[12px] text-slate-400">
            Start the analysis by adding its root cause.
          </p>
          <button
            type="button"
            onClick={() => addNode(null)}
            className="mt-3 rounded-md border border-[#c6e47c]/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.05em] text-[#d5e8a5] hover:bg-[#c6e47c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
          >
            + Add root cause
          </button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(230px,0.85fr)_minmax(0,1.55fr)]">
          <aside
            aria-label="Root cause hierarchy"
            className="border border-slate-800/80 bg-[#0b121a]/70 p-3 sm:p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-slate-200">
                  Hierarchy
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
                </p>
              </div>
              <button
                type="button"
                onClick={addNodeToRoot}
                className="shrink-0 rounded-md border border-slate-700 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-slate-300 transition-colors hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c]"
              >
                + Add node
              </button>
            </div>

            <ol className="mt-3 space-y-1.5">
              {fields.map((field, index) => {
                const node = nodes[index];
                if (!node) return null;
                const parent = nodes.find(
                  (candidate) => candidate.id === node.parentId,
                );
                const isSelected = node.id === nodes[activeIndex]?.id;
                const hasError = hasNodeErrors(errors.rootCauseTree?.[index]);
                const depth = Math.min(getNodeDepth(node, nodes), 5);

                return (
                  <li key={field.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? "true" : undefined}
                      aria-label={`${nodeTypeLabels[node.type]}: ${node.title || `Node ${index + 1}`}${hasError ? ", has validation errors" : ""}`}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{
                        marginInlineStart: `${depth * 12}px`,
                        width: `calc(100% - ${depth * 12}px)`,
                      }}
                      className={`rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e47c] ${
                        isSelected
                          ? "border-[#c6e47c]/70 bg-[#c6e47c]/[0.08]"
                          : "border-slate-800 bg-[#0d1520]/70 hover:border-slate-700"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-slate-100">
                            {node.title.trim() || `Node ${index + 1}`}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.05em] text-slate-500">
                            {nodeTypeLabels[node.type]}
                          </span>
                          {parent ? (
                            <span className="mt-1 block truncate text-[10px] text-slate-500">
                              ↳ {parent.title.trim() || "Untitled parent"}
                            </span>
                          ) : null}
                        </span>
                        {hasError ? (
                          <span className="shrink-0 font-mono text-[9px] text-rose-400">
                            Error
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          <div className="min-w-0 border border-slate-800/80 bg-[#0c151c] p-4 sm:p-5">
            {activeNode ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <h3 className="text-[13px] font-semibold text-slate-100">
                    <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#c6e47c]">
                      Node {String(activeIndex + 1).padStart(2, "0")}
                    </span>
                    {activeNode.title.trim() || "Untitled node"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => addNode(activeNode.id)}
                      className="font-mono text-[10px] uppercase tracking-[0.05em] text-[#c6e47c] hover:text-[#dcf7a0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c6e47c]"
                    >
                      + Add child
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNode(activeIndex)}
                      disabled={
                        activeNode.parentId === null &&
                        nodes.some((node) => node.parentId === activeNode.id)
                      }
                      title={
                        activeNode.parentId === null &&
                        nodes.some((node) => node.parentId === activeNode.id)
                          ? "Move or remove this node's children first"
                          : undefined
                      }
                      className="font-mono text-[10px] uppercase tracking-[0.05em] text-slate-500 transition-colors hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {(() => {
                  const index = activeIndex;
                  const nodeErrors = errors.rootCauseTree?.[index];
                  const descendantIds = getDescendantIds(activeNode.id, nodes);
                  const isRoot = activeNode.parentId === null;

                  return (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`root-cause-${index}-type`} className={labelClass}>
                            Node type
                          </label>
                          <select
                            id={`root-cause-${index}-type`}
                            aria-invalid={Boolean(nodeErrors?.type)}
                            {...register(`rootCauseTree.${index}.type` as const)}
                            className={inputClass(Boolean(nodeErrors?.type))}
                          >
                            {rootCauseNodeTypeSchema.options.map((type) => (
                              <option key={type} value={type} className="bg-[#0b121a] text-slate-100">
                                {nodeTypeLabels[type]}
                              </option>
                            ))}
                          </select>
                          {nodeErrors?.type ? (
                            <p role="alert" className={fieldErrorClass}>
                              {nodeErrors.type.message}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label htmlFor={`root-cause-${index}-parent`} className={labelClass}>
                            Parent node
                          </label>
                          {isRoot ? (
                            <p id={`root-cause-${index}-parent`} className={ghostClass}>
                              No parent (root)
                            </p>
                          ) : (
                            <select
                              id={`root-cause-${index}-parent`}
                              value={activeNode.parentId ?? ""}
                              aria-invalid={Boolean(nodeErrors?.parentId)}
                              onChange={(event) =>
                                setValue(
                                  `rootCauseTree.${index}.parentId`,
                                  event.target.value,
                                  { shouldDirty: true, shouldValidate: true },
                                )
                              }
                              className={inputClass(Boolean(nodeErrors?.parentId))}
                            >
                              {nodes
                                .filter((candidate) => !descendantIds.has(candidate.id))
                                .map((candidate) => (
                                  <option key={candidate.id} value={candidate.id} className="bg-[#0b121a] text-slate-100">
                                    {candidate.title.trim() ||
                                      `Node ${nodes.indexOf(candidate) + 1}`}
                                  </option>
                                ))}
                            </select>
                          )}
                          {nodeErrors?.parentId ? (
                            <p role="alert" className={fieldErrorClass}>
                              {nodeErrors.parentId.message}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`root-cause-${index}-title`} className={labelClass}>
                          Title
                        </label>
                        <input
                          id={`root-cause-${index}-title`}
                          type="text"
                          aria-invalid={Boolean(nodeErrors?.title)}
                          {...register(`rootCauseTree.${index}.title` as const, {
                            onChange: () => clearErrors(`rootCauseTree.${index}.title` as const),
                          })}
                          placeholder="e.g. Database connection pool exhausted"
                          className={inputClass(Boolean(nodeErrors?.title))}
                        />
                        {nodeErrors?.title ? (
                          <p role="alert" className={fieldErrorClass}>
                            {nodeErrors.title.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`root-cause-${index}-description`} className={labelClass}>
                          Description
                        </label>
                        <textarea
                          id={`root-cause-${index}-description`}
                          rows={3}
                          aria-invalid={Boolean(nodeErrors?.description)}
                          {...register(`rootCauseTree.${index}.description` as const)}
                          placeholder="Explain how this factor contributed to the incident."
                          className={`${inputClass(Boolean(nodeErrors?.description))} h-auto py-2.5 leading-5`}
                        />
                        {nodeErrors?.description ? (
                          <p role="alert" className={fieldErrorClass}>
                            {nodeErrors.description.message}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <label htmlFor={`root-cause-${index}-component`} className={labelClass}>
                          System component
                        </label>
                        <input
                          id={`root-cause-${index}-component`}
                          type="text"
                          aria-invalid={Boolean(nodeErrors?.systemComponent)}
                          {...register(`rootCauseTree.${index}.systemComponent` as const)}
                          placeholder="e.g. Payment API"
                          className={inputClass(Boolean(nodeErrors?.systemComponent))}
                        />
                        {nodeErrors?.systemComponent ? (
                          <p role="alert" className={fieldErrorClass}>
                            {nodeErrors.systemComponent.message}
                          </p>
                        ) : null}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : null}
          </div>
        </div>
      )}

      <section className="space-y-5 border-t border-slate-800/80 pt-6">
        <FormSectionHeading
          title="Architecture before / after"
          description="Describe how the system architecture changed to address the incident, and clarify whether the change is documented fact or a reconstruction."
        />

        <div>
          <label htmlFor="architecture-before-fix" className={labelClass}>
            Before the fix
          </label>
          <textarea
            id="architecture-before-fix"
            rows={4}
            {...register("architectureDiff.beforeFix")}
            placeholder="Describe the relevant architecture and how it behaved before the fix."
            className={`${inputClass(Boolean(errors.architectureDiff?.beforeFix))} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.beforeFix ? (
            <p role="alert" className={fieldErrorClass}>
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
            className={`${inputClass(Boolean(errors.architectureDiff?.afterFix))} h-auto py-2.5 leading-5`}
          />
          {errors.architectureDiff?.afterFix ? (
            <p role="alert" className={fieldErrorClass}>
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
                    ref={field.ref}
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
              className={`${inputClass(Boolean(errors.architectureDiff?.notes))} h-auto py-2.5 leading-5`}
            />
            {errors.architectureDiff?.notes ? (
              <p role="alert" className={fieldErrorClass}>
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
