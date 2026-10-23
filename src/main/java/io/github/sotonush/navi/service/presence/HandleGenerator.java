package io.github.sotonush.navi.service.presence;

import org.springframework.stereotype.Component;

import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class HandleGenerator {

    private static final List<String> NAMES = List.of(
            "lain", "alice", "mika", "taro", "chisa", "reika", "myu", "masami",
            "navi", "copland", "knights", "phantom", "deus", "wired", "layer", "protocol"
    );
    private static final int SUFFIX_BOUND = 0x10000;

    public String next() {
        ThreadLocalRandom random = ThreadLocalRandom.current();
        String name = NAMES.get(random.nextInt(NAMES.size()));
        String suffix = HexFormat.of().toHexDigits((short) random.nextInt(SUFFIX_BOUND));
        return name + "-" + suffix;
    }
}
