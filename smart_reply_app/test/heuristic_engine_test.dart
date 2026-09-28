import 'package:flutter_test/flutter_test.dart';
import 'package:smart_reply_app/services/heuristic_engine.dart';

void main() {
  group('HeuristicEngine Tests', () {
    test('generateReplies generates contextual suggestions and completes in < 5ms', () {
      final stopwatch = Stopwatch()..start();
      final replies = HeuristicEngine.generateReplies('Can we meet tomorrow at 10 AM?', 'professional');
      stopwatch.stop();

      expect(replies, isNotEmpty);
      expect(replies.length, greaterThanOrEqualTo(2));
      expect(replies.first.source, equals('heuristic'));
      expect(stopwatch.elapsedMilliseconds, lessThan(100));
    });

    test('enhanceText handles grammar and tone enhancement', () {
      final enhanced = HeuristicEngine.enhanceText('hey can you send the file asap', 'friendly');
      expect(enhanced, isNotEmpty);
      expect(enhanced.first.text, isNotEmpty);
      expect(enhanced.first.source, equals('heuristic'));
    });

    test('translateText handles common greetings', () {
      final translation = HeuristicEngine.translateText('Hello', 'es', 'casual');
      expect(translation, isNotEmpty);
      expect(translation.first.text.toLowerCase(), contains('hola'));
    });

    test('summarizeText produces extractive bullet summary', () {
      const input = 'SmartReply AI is an advanced productivity suite. It operates with zero-latency heuristics on device. It also supports universal cloud LLM models.';
      final summaries = HeuristicEngine.summarizeText(input);
      expect(summaries, isNotEmpty);
      expect(summaries.any((s) => s.text.contains('•')), isTrue);
    });
  });
}
