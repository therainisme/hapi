import { describe, expect, it } from 'vitest';
import { ReasoningProcessor, type ReasoningOutput } from './reasoningProcessor';

describe('ReasoningProcessor', () => {
    it('finalize(completed) closes an in-flight titled reasoning tool call', () => {
        const events: ReasoningOutput[] = [];
        const processor = new ReasoningProcessor((event) => events.push(event as ReasoningOutput));

        processor.processDelta('**');
        processor.processDelta('Foo');
        processor.processDelta('**');
        processor.processDelta(' bar');

        processor.finalize('completed');

        expect(events.length).toBe(2);
        expect(events[0]).toMatchObject({
            type: 'tool-call',
            name: 'CodexReasoning',
            input: { title: 'Foo' }
        });
        expect(events[1]).toMatchObject({
            type: 'tool-call-result',
            output: {
                content: ' bar',
                status: 'completed'
            }
        });
        expect((events[0] as { callId: string }).callId).toBe((events[1] as { callId: string }).callId);
    });

    it('finalize(canceled) closes an in-flight titled reasoning tool call', () => {
        const events: ReasoningOutput[] = [];
        const processor = new ReasoningProcessor((event) => events.push(event as ReasoningOutput));

        processor.processDelta('**');
        processor.processDelta('Foo');
        processor.processDelta('**');

        processor.finalize('canceled');

        expect(events.length).toBe(2);
        expect(events[1]).toMatchObject({
            type: 'tool-call-result',
            output: {
                status: 'canceled'
            }
        });
        expect((events[0] as { callId: string }).callId).toBe((events[1] as { callId: string }).callId);
    });
});
